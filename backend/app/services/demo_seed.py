"""Demo world: made-up villagers (named after colors) and two starter guilds.

Runs only when the demo account is enabled. Safe to run on every startup:
it only creates what's missing and only grants XP to villagers who have none
(for example after Redis data was cleared).
"""
import asyncio
import logging
import secrets

from sqlalchemy import select

from app.api.auth import hash_password
from app.db.engine import async_session
from app.models.team import Team
from app.models.user import User
from app.services.game_client import GameClient

logger = logging.getLogger("questforge.demo")

VILLAGERS = [
    # username, display name, avatar, XP, guild
    ("indigo", "Indigo", {"skin": "deep", "hair": "spiky", "hair_color": "silver", "face": "determined", "color": "indigo", "hat": "none"}, 905, "Night Owls"),
    ("saffron", "Saffron", {"skin": "peach", "hair": "long", "hair_color": "red", "face": "smile", "color": "saffron", "hat": "straw"}, 640, "Willowbrook Co-op"),
    ("plum", "Plum", {"skin": "olive", "hair": "ponytail", "hair_color": "black", "face": "sleepy", "color": "plum", "hat": "flowers"}, 410, "Night Owls"),
    ("teal", "Teal", {"skin": "tan", "hair": "short", "hair_color": "blue", "face": "glasses", "color": "teal", "hat": "cap"}, 260, "Willowbrook Co-op"),
    ("coral", "Coral", {"skin": "brown", "hair": "long", "hair_color": "pink", "face": "surprised", "color": "coral", "hat": "none"}, 120, "Willowbrook Co-op"),
    ("amber", "Amber", {"skin": "porcelain", "hair": "short", "hair_color": "blonde", "face": "smile", "color": "amber", "hat": "bandana"}, 48, "Willowbrook Co-op"),
    ("slate", "Slate", {"skin": "peach", "hair": "bald", "hair_color": "brown", "face": "determined", "color": "slate", "hat": "beanie"}, 35, None),
]

GUILDS = {
    # name: (invite code, founder username, seats)
    "Willowbrook Co-op": ("MILL-2048", "saffron", 8),
    "Night Owls": ("LARK-7311", "indigo", 6),
}


async def seed_demo_world() -> None:
    game = GameClient()
    created: dict[str, User] = {}

    async with async_session() as session:
        users: dict[str, User] = {}
        for username, display, look, _xp, _guild in VILLAGERS:
            user = (await session.execute(select(User).where(User.username == username))).scalar_one_or_none()
            if user is None:
                user = User(
                    email=f"{username}@villagers.questforge.test",
                    username=username,
                    display_name=display,
                    # Villagers can't log in: their password is random and never stored anywhere
                    password_hash=hash_password(secrets.token_urlsafe(24)),
                    preferences={"avatar": look},
                )
                session.add(user)
                created[username] = user
            elif (user.preferences or {}).get("avatar", {}).keys() != look.keys():
                # villagers seeded before the full avatar options existed get their complete look
                user.preferences = {**(user.preferences or {}), "avatar": look}
            users[username] = user
        await session.flush()

        for name, (code, founder, seats) in GUILDS.items():
            team = (await session.execute(select(Team).where(Team.name == name))).scalar_one_or_none()
            if team is None:
                team = Team(name=name, owner_id=users[founder].id, invite_code=code, seat_count=seats, context="community")
                session.add(team)
                await session.flush()
            for username, *_rest, guild in VILLAGERS:
                if guild == name and users[username].team_id is None and username in created:
                    users[username].team_id = team.id
        await session.commit()

        villager_ids = {u: (str(users[u].id), str(users[u].team_id) if users[u].team_id else None) for u in users}

    # Give villagers their XP through the game engine (waits for the engine to come up)
    for attempt in range(1, 21):
        try:
            for username, *_mid, xp, _guild in VILLAGERS:
                user_id, team_id = villager_ids[username]
                current = (await game.check_level(user_id)).get("total_xp", 0)
                remaining = xp - current
                while remaining > 0:  # the engine caps a single grant at 100 XP
                    step = min(remaining, 100)
                    await game.grant_xp(user_id, step, reason="demo_seed", team_id=team_id)
                    remaining -= step
            logger.warning("Demo villagers ready")
            return
        except Exception as exc:
            logger.warning("Waiting for game engine to seed demo villagers (%s/20): %s", attempt, exc)
            await asyncio.sleep(2)
