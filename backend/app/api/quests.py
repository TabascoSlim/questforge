import asyncio
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_session
from app.models.user import User
from app.models.quest import Quest
from app.models.activity import ActivityLog
from app.api.deps import get_current_user
from app.services.game_client import GameClient
from app.services.avatars import DEFAULT_AVATAR, avatar_of

router = APIRouter()
game = GameClient()


class QuestResponse(BaseModel):
    id: str
    title: str
    description: str | None
    category: str
    difficulty: int
    xp_reward: int
    narrative_text: str | None
    status: str
    completed_at: str | None


class CompleteQuestResponse(BaseModel):
    xp_earned: int
    total_xp: int
    level: int
    leveled_up: bool


@router.get("", response_model=list[QuestResponse])
async def list_quests(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Quest).where(Quest.user_id == user.id).order_by(Quest.created_at.desc())
    )
    quests = result.scalars().all()
    return [
        QuestResponse(
            id=str(q.id),
            title=q.title,
            description=q.description,
            category=q.category,
            difficulty=q.difficulty,
            xp_reward=q.xp_reward,
            narrative_text=q.narrative_text,
            status=q.status,
            completed_at=q.completed_at.isoformat() if q.completed_at else None,
        )
        for q in quests
    ]


@router.get("/today", response_model=list[QuestResponse])
async def today_quests(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    result = await session.execute(
        select(Quest).where(
            Quest.user_id == user.id,
            Quest.created_at >= today_start,
        ).order_by(Quest.created_at.asc())
    )
    quests = result.scalars().all()
    return [
        QuestResponse(
            id=str(q.id),
            title=q.title,
            description=q.description,
            category=q.category,
            difficulty=q.difficulty,
            xp_reward=q.xp_reward,
            narrative_text=q.narrative_text,
            status=q.status,
            completed_at=q.completed_at.isoformat() if q.completed_at else None,
        )
        for q in quests
    ]


@router.post("/{quest_id}/complete", response_model=CompleteQuestResponse)
async def complete_quest(
    quest_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Quest).where(Quest.id == quest_id, Quest.user_id == user.id)
    )
    quest = result.scalar_one_or_none()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.status == "completed":
        raise HTTPException(status_code=400, detail="Quest already completed")

    quest.status = "completed"
    quest.completed_at = datetime.utcnow()

    activity = ActivityLog(
        user_id=user.id,
        quest_id=quest.id,
        activity_type="quest_complete",
        xp_earned=quest.xp_reward,
    )
    session.add(activity)
    await session.flush()

    # Count today toward the streak first, so today's streak bonus applies to this quest's XP
    await game.tick_streak(str(user.id))
    team_id = str(user.team_id) if user.team_id else None
    result = await game.grant_xp(str(user.id), quest.xp_reward, team_id=team_id)

    xp_earned = result.get("xp_granted", quest.xp_reward)
    activity.xp_earned = xp_earned

    return CompleteQuestResponse(
        xp_earned=xp_earned,
        total_xp=result.get("total_xp", 0),
        level=result.get("level", 1),
        leveled_up=result.get("leveled_up", False),
    )


@router.get("/leaderboard")
async def leaderboard(
    scope: str = "everyone",
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """scope="everyone" for all players, or "guild" for your guild's members."""
    team_id = str(user.team_id) if (scope == "guild" and user.team_id) else None
    if team_id:
        # Rank the guild's current members by their total XP, so someone who
        # joins later shows up with everything they've earned (and leavers drop off).
        rows = await session.execute(select(User).where(User.team_id == user.team_id))
        members = rows.scalars().all()

        async def total_xp(member: User) -> int:
            try:
                return int((await game.check_level(str(member.id))).get("total_xp", 0))
            except Exception:
                return 0

        totals = await asyncio.gather(*(total_xp(m) for m in members))
        entries = sorted(
            ({"user_id": str(m.id), "total_xp": xp} for m, xp in zip(members, totals)),
            key=lambda e: e["total_xp"],
            reverse=True,
        )
    else:
        data = await game.get_leaderboard()
        entries = data.get("leaderboard", []) if isinstance(data, dict) else data

    # The engine stores user IDs; look up usernames so the leaderboard shows names, not codes
    ids = []
    for entry in entries:
        try:
            ids.append(uuid.UUID(entry["user_id"]))
        except (KeyError, ValueError):
            continue
    people: dict[str, User] = {}
    if ids:
        rows = await session.execute(select(User).where(User.id.in_(ids)))
        people = {str(u.id): u for u in rows.scalars().all()}

    board = []
    for entry in entries:
        person = people.get(entry.get("user_id", ""))
        board.append({
            **entry,
            "username": (person.display_name or person.username) if person else "Unknown adventurer",
            "avatar": avatar_of(person) if person else DEFAULT_AVATAR,
            "is_you": entry.get("user_id") == str(user.id),
        })
    return {"leaderboard": board, "scope": "guild" if team_id else "everyone"}


@router.get("/stats")
async def stats(
    user: User = Depends(get_current_user),
):
    level_data = await game.check_level(str(user.id))
    streak_data = await game.get_streak(str(user.id))
    return {
        "total_xp": level_data.get("total_xp", 0),
        "level": level_data.get("level", 1),
        "xp_in_level": level_data.get("xp_in_level", 0),
        "xp_to_next": level_data.get("xp_to_next", 100),
        "current_streak": streak_data.get("current_streak", 0),
        "last_activity_date": streak_data.get("last_activity_date"),
    }
