import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.engine import get_session
from app.models.team import Team
from app.models.user import User
from app.services.avatars import avatar_of

router = APIRouter()

# Words for friendly invite codes like "OAK-4821"
CODE_WORDS = [
    "OAK", "FERN", "MOSS", "PEAR", "PLUM", "SAGE", "WREN", "HAWK", "PINE", "ROSE",
    "MINT", "BEAN", "CORN", "HIVE", "MILL", "BARN", "LARK", "BIRCH", "CLAY", "DEW",
]


async def new_invite_code(session: AsyncSession) -> str:
    """Generate an invite code that isn't already taken."""
    while True:
        code = f"{secrets.choice(CODE_WORDS)}-{secrets.randbelow(9000) + 1000}"
        taken = await session.execute(select(Team.id).where(Team.invite_code == code))
        if taken.scalar_one_or_none() is None:
            return code


def normalize_code(code: str) -> str:
    return code.strip().upper().replace(" ", "-")


class TeamCreateRequest(BaseModel):
    name: str
    context: str = "company"

    @field_validator("name")
    @classmethod
    def name_length(cls, v: str) -> str:
        v = v.strip()
        if not 3 <= len(v) <= 40:
            raise ValueError("Guild name must be 3-40 characters")
        return v


class JoinByCodeRequest(BaseModel):
    invite_code: str


class TeamMemberResponse(BaseModel):
    id: str
    username: str
    display_name: str | None
    is_owner: bool = False
    is_you: bool = False
    avatar: dict | None = None


class TeamResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    seat_count: int
    subscription_active: bool
    context: str
    member_count: int
    invite_code: str | None = None  # only shown to members


class TeamListItem(BaseModel):
    id: str
    name: str
    member_count: int
    seat_count: int
    is_full: bool
    is_mine: bool


class MyTeamResponse(BaseModel):
    team: TeamResponse | None
    members: list[TeamMemberResponse]


async def _members(session: AsyncSession, team: Team) -> list[User]:
    result = await session.execute(
        select(User)
        .where(User.team_id == team.id, User.is_active.is_(True))
        .order_by(User.created_at.asc())
    )
    return list(result.scalars().all())


def _team_response(team: Team, member_count: int, include_code: bool) -> TeamResponse:
    return TeamResponse(
        id=str(team.id),
        name=team.name,
        owner_id=str(team.owner_id),
        seat_count=team.seat_count,
        subscription_active=team.subscription_active,
        context=team.context,
        member_count=member_count,
        invite_code=team.invite_code if include_code else None,
    )


async def _join(session: AsyncSession, user: User, team: Team) -> TeamResponse:
    if user.team_id:
        raise HTTPException(status_code=400, detail="You're already in a guild. Leave it first to join another.")
    members = await _members(session, team)
    if len(members) >= team.seat_count:
        raise HTTPException(status_code=400, detail="That guild is full")
    user.team_id = team.id
    await session.flush()
    return _team_response(team, len(members) + 1, include_code=True)


@router.get("", response_model=list[TeamListItem])
async def list_teams(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """All guilds, with member counts, so players can browse and join with one click."""
    counts = (
        select(User.team_id, func.count(User.id).label("n"))
        .where(User.is_active.is_(True), User.team_id.is_not(None))
        .group_by(User.team_id)
        .subquery()
    )
    rows = await session.execute(
        select(Team, func.coalesce(counts.c.n, 0))
        .outerjoin(counts, counts.c.team_id == Team.id)
        .order_by(func.coalesce(counts.c.n, 0).desc(), Team.created_at.asc())
    )
    return [
        TeamListItem(
            id=str(team.id),
            name=team.name,
            member_count=n,
            seat_count=team.seat_count,
            is_full=n >= team.seat_count,
            is_mine=user.team_id == team.id,
        )
        for team, n in rows.all()
    ]


@router.get("/mine", response_model=MyTeamResponse)
async def my_team(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not user.team_id:
        return MyTeamResponse(team=None, members=[])
    team = (await session.execute(select(Team).where(Team.id == user.team_id))).scalar_one_or_none()
    if not team:
        return MyTeamResponse(team=None, members=[])
    members = await _members(session, team)
    return MyTeamResponse(
        team=_team_response(team, len(members), include_code=True),
        members=[
            TeamMemberResponse(
                id=str(m.id),
                username=m.username,
                display_name=m.display_name,
                is_owner=m.id == team.owner_id,
                is_you=m.id == user.id,
                avatar=avatar_of(m),
            )
            for m in members
        ],
    )


@router.post("", response_model=TeamResponse)
async def create_team(
    req: TeamCreateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if user.team_id:
        raise HTTPException(status_code=400, detail="You're already in a guild. Leave it first to found a new one.")

    team = Team(
        name=req.name,
        owner_id=user.id,
        context=req.context,
        invite_code=await new_invite_code(session),
    )
    session.add(team)
    await session.flush()

    user.team_id = team.id
    await session.flush()
    return _team_response(team, 1, include_code=True)


@router.post("/join", response_model=TeamResponse)
async def join_by_code(
    req: JoinByCodeRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    code = normalize_code(req.invite_code)
    team = (await session.execute(select(Team).where(Team.invite_code == code))).scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail=f"No guild found with code {code}. Check the code and try again.")
    return await _join(session, user, team)


@router.post("/leave")
async def leave_team(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not user.team_id:
        raise HTTPException(status_code=400, detail="You're not in a guild")
    team = (await session.execute(select(Team).where(Team.id == user.team_id))).scalar_one_or_none()
    user.team_id = None
    await session.flush()

    if team:
        remaining = await _members(session, team)
        if not remaining:
            await session.delete(team)  # empty guilds are removed
        elif team.owner_id == user.id:
            team.owner_id = remaining[0].id  # leadership passes to the longest-standing member
        await session.flush()
    return {"detail": "Left the guild"}


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    team = (await session.execute(select(Team).where(Team.id == team_id))).scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Guild not found")
    members = await _members(session, team)
    return _team_response(team, len(members), include_code=user.team_id == team.id)


@router.get("/{team_id}/members", response_model=list[TeamMemberResponse])
async def get_team_members(
    team_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    team = (await session.execute(select(Team).where(Team.id == team_id))).scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Guild not found")
    return [
        TeamMemberResponse(id=str(m.id), username=m.username, display_name=m.display_name, is_owner=m.id == team.owner_id)
        for m in await _members(session, team)
    ]


@router.post("/{team_id}/join", response_model=TeamResponse)
async def join_team(
    team_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    team = (await session.execute(select(Team).where(Team.id == team_id))).scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Guild not found")
    return await _join(session, user, team)
