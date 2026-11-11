import json
import logging
import re
from datetime import datetime, timedelta

from sqlalchemy import delete, func, select, update

from app.config import settings
from app.db.engine import async_session
from app.models.activity import ActivityLog
from app.models.quest import Quest
from app.models.user import User
from app.services.game_client import GameClient
from app.services.prompt_templates import (
    LEVEL_UP_TEMPLATE,
    QUESTS_SYSTEM_PROMPT,
    QUESTS_USER_TEMPLATE,
    STREAK_WARNING_TEMPLATE,
)

logger = logging.getLogger("questforge.agent")

VALID_CATEGORIES = {"focus", "wellness", "social", "misc"}
QUESTS_PER_DAY = 4


class LLMUnavailable(Exception):
    """Raised when no AI provider/key is configured, so callers use their fallback."""


class AgentService:
    def __init__(self):
        self.provider = settings.llm_provider.lower()
        self.openai_api_key = settings.openai_api_key
        self.anthropic_api_key = settings.anthropic_api_key
        self.game = GameClient()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate_daily_quests(self, user: User, force_new: bool = False) -> list[dict]:
        if not force_new:
            existing = await self._get_todays_quests(user)
            if existing:
                return existing
        else:
            # Re-rolling replaces today's unfinished quests; completed ones are kept
            await self._delete_todays_active_quests(user)

        stats = await self._compute_user_stats(user)
        prompt = QUESTS_USER_TEMPLATE.format(
            num_quests=QUESTS_PER_DAY,
            username=user.username or user.display_name or "Adventurer",
            level=stats.get("level", 1),
            categories=", ".join((user.preferences or {}).get("categories", sorted(VALID_CATEGORIES))),
            streak_count=stats.get("streak", 0),
            completion_rate=round(stats.get("completion_rate", 0.5) * 100),
            tier=user.subscription_tier,
        )

        try:
            quests = self._clean_quests(await self._call_llm(QUESTS_SYSTEM_PROMPT, prompt))
        except LLMUnavailable:
            quests = []
        except Exception as exc:
            logger.warning("Quest generation failed, using preset quests: %s", exc)
            quests = []
        if not quests:
            quests = self._fallback_quests()

        await self._persist_quests(user.id, quests)
        # Return what was saved, including database IDs, so quests can be completed right away
        return await self._get_todays_quests(user) or []

    async def generate_level_up_message(self, user: User, level: int) -> str:
        prompt = LEVEL_UP_TEMPLATE.format(username=user.username or "Adventurer", level=level)
        try:
            return await self._call_llm_simple(prompt)
        except Exception:
            return f"Level {level}! Your legend grows, {user.username or 'Adventurer'}!"

    async def generate_streak_warning(self, user: User, streak: int) -> str:
        prompt = STREAK_WARNING_TEMPLATE.format(username=user.username or "Adventurer", streak_count=streak)
        try:
            return await self._call_llm_simple(prompt)
        except Exception:
            return f"The flame flickers... complete a quest today to keep your {streak}-day streak alive!"

    # ------------------------------------------------------------------
    # LLM calls
    # ------------------------------------------------------------------

    def _active_provider(self) -> str:
        if self.provider == "anthropic" and self.anthropic_api_key:
            return "anthropic"
        if self.provider == "openai" and self.openai_api_key:
            return "openai"
        raise LLMUnavailable()

    async def _call_llm(self, system: str, user: str) -> object:
        provider = self._active_provider()
        if provider == "anthropic":
            from anthropic import AsyncAnthropic

            client = AsyncAnthropic(api_key=self.anthropic_api_key)
            resp = await client.messages.create(
                model=settings.anthropic_model,
                system=system,
                messages=[{"role": "user", "content": user}],
                max_tokens=2000,
            )
            text = "".join(block.text for block in resp.content if getattr(block, "type", "") == "text")
        else:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=self.openai_api_key)
            resp = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
                response_format={"type": "json_object"},
            )
            text = resp.choices[0].message.content or ""
        return self._parse_json(text)

    async def _call_llm_simple(self, prompt: str) -> str:
        provider = self._active_provider()  # raises LLMUnavailable -> caller's fallback message
        if provider == "anthropic":
            from anthropic import AsyncAnthropic

            client = AsyncAnthropic(api_key=self.anthropic_api_key)
            resp = await client.messages.create(
                model=settings.anthropic_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
            )
            text = "".join(block.text for block in resp.content if getattr(block, "type", "") == "text")
        else:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=self.openai_api_key)
            resp = await client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "user", "content": prompt}],
            )
            text = resp.choices[0].message.content or ""
        text = text.strip().strip('"')
        if not text:
            raise ValueError("Empty AI response")
        return text

    # ------------------------------------------------------------------
    # Parsing & validation of AI output
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_json(text: str) -> object:
        """Parse JSON from an AI reply, tolerating ```json fences or text around the JSON."""
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"(\{.*\}|\[.*\])", cleaned, flags=re.DOTALL)
            if not match:
                raise
            return json.loads(match.group(1))

    @staticmethod
    def _clean_quests(data: object) -> list[dict]:
        """Accept {"quests": [...]} or a bare list; keep only well-formed quests with sane values."""
        if isinstance(data, dict):
            items = data.get("quests")
            if items is None:
                items = next((v for v in data.values() if isinstance(v, list)), [])
        elif isinstance(data, list):
            items = data
        else:
            items = []

        def as_int(value: object, default: int, low: int, high: int) -> int:
            try:
                return max(low, min(high, int(value)))
            except (TypeError, ValueError):
                return default

        cleaned = []
        for item in items:
            if not isinstance(item, dict) or not str(item.get("title", "")).strip():
                continue
            category = str(item.get("category", "misc")).lower().strip()
            cleaned.append({
                "title": str(item["title"]).strip()[:255],
                "description": str(item.get("description", "")).strip(),
                "category": category if category in VALID_CATEGORIES else "misc",
                "difficulty": as_int(item.get("difficulty"), 1, 1, 5),
                "xp_reward": as_int(item.get("xp_reward"), 10, 10, 50),
                "narrative_text": str(item.get("narrative_text", "")).strip(),
            })
        return cleaned[:5]

    @staticmethod
    def _fallback_quests() -> list[dict]:
        return [
            {
                "title": "Deep Focus Sprint",
                "description": "Complete 4 focused 25-minute work sessions without distractions",
                "category": "focus",
                "difficulty": 2,
                "xp_reward": 20,
                "narrative_text": "The Tower of Tasks awaits. Can you hold the line for four rounds of concentrated power?",
            },
            {
                "title": "Recharge Ritual",
                "description": "Take a 10-minute break away from your screen",
                "category": "wellness",
                "difficulty": 1,
                "xp_reward": 10,
                "narrative_text": "Even heroes must rest. Step away from the glow and restore your stamina.",
            },
            {
                "title": "Allied Check-In",
                "description": "Send a message to a colleague just to say hi",
                "category": "social",
                "difficulty": 1,
                "xp_reward": 10,
                "narrative_text": "No adventurer walks alone. Forge a bond with a fellow traveler.",
            },
            {
                "title": "Tidy the Camp",
                "description": "Clear one small chore you've been putting off",
                "category": "misc",
                "difficulty": 1,
                "xp_reward": 15,
                "narrative_text": "A cluttered camp slows any journey. Banish one lingering errand.",
            },
        ]

    # ------------------------------------------------------------------
    # Database helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _today_start() -> datetime:
        return datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    async def _get_todays_quests(self, user: User) -> list[dict] | None:
        async with async_session() as session:
            result = await session.execute(
                select(Quest)
                .where(Quest.user_id == user.id, Quest.created_at >= self._today_start())
                .order_by(Quest.created_at.asc())
            )
            quests = result.scalars().all()
            if not quests:
                return None
            return [
                {
                    "id": str(q.id),
                    "title": q.title,
                    "description": q.description,
                    "category": q.category,
                    "difficulty": q.difficulty,
                    "xp_reward": q.xp_reward,
                    "narrative_text": q.narrative_text,
                    "status": q.status,
                    "completed_at": q.completed_at.isoformat() if q.completed_at else None,
                }
                for q in quests
            ]

    async def reset_today(self, user: User) -> list[dict]:
        """Demo only: clear ALL of today's quests (done or not) and post a fresh set."""
        async with async_session() as session:
            todays_ids = select(Quest.id).where(Quest.user_id == user.id, Quest.created_at >= self._today_start())
            # Keep the XP history, but detach it from the quests being removed (they're referenced by ID)
            await session.execute(
                update(ActivityLog).where(ActivityLog.quest_id.in_(todays_ids)).values(quest_id=None)
            )
            await session.execute(
                delete(Quest).where(Quest.user_id == user.id, Quest.created_at >= self._today_start())
            )
            await session.commit()
        return await self.generate_daily_quests(user)

    async def _delete_todays_active_quests(self, user: User) -> None:
        async with async_session() as session:
            await session.execute(
                delete(Quest).where(
                    Quest.user_id == user.id,
                    Quest.created_at >= self._today_start(),
                    Quest.status != "completed",
                )
            )
            await session.commit()

    async def _persist_quests(self, user_id, quests: list[dict]) -> None:
        async with async_session() as session:
            for q in quests:
                session.add(Quest(
                    user_id=user_id,
                    title=q["title"],
                    description=q.get("description", ""),
                    category=q.get("category", "misc"),
                    difficulty=q.get("difficulty", 1),
                    xp_reward=q.get("xp_reward", 10),
                    narrative_text=q.get("narrative_text", ""),
                ))
            await session.commit()

    async def _compute_user_stats(self, user: User) -> dict:
        async with async_session() as session:
            week_ago = datetime.utcnow() - timedelta(days=7)
            total = (await session.execute(
                select(func.count()).select_from(Quest).where(
                    Quest.user_id == user.id, Quest.created_at >= week_ago
                )
            )).scalar() or 0
            completed = (await session.execute(
                select(func.count()).select_from(Quest).where(
                    Quest.user_id == user.id, Quest.created_at >= week_ago, Quest.status == "completed"
                )
            )).scalar() or 0
        completion_rate = completed / total if total > 0 else 0.5

        # The game engine personalizes difficulty; if it's unreachable, still generate quests
        try:
            level_data = await self.game.check_level(str(user.id))
            streak_data = await self.game.get_streak(str(user.id))
        except Exception as exc:
            logger.warning("Game engine unavailable for stats: %s", exc)
            level_data, streak_data = {}, {}

        return {
            "level": level_data.get("level", 1),
            "streak": streak_data.get("current_streak", 0),
            "completion_rate": completion_rate,
        }
