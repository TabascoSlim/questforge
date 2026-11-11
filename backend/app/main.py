import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import select, text
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401  (registers every table with SQLAlchemy before create_all)
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.quests import router as quests_router
from app.api.agent import router as agent_router
from app.api.teams import router as teams_router
from app.config import settings
from app.db.engine import Base, async_session, engine

logger = logging.getLogger("questforge")


async def init_db(retries: int = 15, delay_seconds: float = 2.0) -> None:
    """Create database tables on startup, waiting for Postgres to accept connections."""
    for attempt in range(1, retries + 1):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                # Lightweight migration for databases created before invite codes existed
                await conn.execute(text("ALTER TABLE teams ADD COLUMN IF NOT EXISTS invite_code VARCHAR(12)"))
                await conn.execute(text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_teams_invite_code ON teams (invite_code)"
                ))
            await backfill_invite_codes()
            logger.info("Database ready")
            return
        except Exception as exc:  # Postgres may still be starting up
            if attempt == retries:
                raise
            logger.warning("Database not ready (attempt %s/%s): %s", attempt, retries, exc)
            await asyncio.sleep(delay_seconds)


async def seed_demo_user() -> None:
    """Create the documented demo account if it's enabled and doesn't exist yet."""
    from app.api.auth import demo_enabled, get_or_create_demo_user

    if not demo_enabled():
        return
    async with async_session() as session:
        await get_or_create_demo_user(session)
        await session.commit()
    logger.warning("Demo account ready (one-click login via the 'Try the demo' button)")


async def backfill_invite_codes() -> None:
    """Give an invite code to any guild created before codes existed."""
    from app.api.teams import new_invite_code
    from app.models.team import Team

    async with async_session() as session:
        teams = (await session.execute(select(Team).where(Team.invite_code.is_(None)))).scalars().all()
        for team in teams:
            team.invite_code = await new_invite_code(session)
        if teams:
            await session.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    await seed_demo_user()
    seed_task = None
    if settings.demo_user_enabled:
        from app.services.demo_seed import seed_demo_world

        # Runs in the background so startup isn't blocked while the game engine boots
        seed_task = asyncio.create_task(seed_demo_world())
    yield
    if seed_task and not seed_task.done():
        seed_task.cancel()
    await engine.dispose()


app = FastAPI(title="QuestForge", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(quests_router, prefix="/api/quests", tags=["quests"])
app.include_router(agent_router, prefix="/api/agent", tags=["agent"])
app.include_router(teams_router, prefix="/api/teams", tags=["teams"])


@app.get("/health")
async def health():
    return {"status": "ok"}
