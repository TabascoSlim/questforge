from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.engine import get_session
from app.models.user import User
from app.api.auth import is_demo_user
from app.services.avatars import AVATAR_OPTIONS, DEFAULT_AVATAR, avatar_of

router = APIRouter()

VALID_CATEGORIES = ["focus", "wellness", "social", "misc"]


class Avatar(BaseModel):
    skin: str = DEFAULT_AVATAR["skin"]
    hair: str = DEFAULT_AVATAR["hair"]
    hair_color: str = DEFAULT_AVATAR["hair_color"]
    face: str = DEFAULT_AVATAR["face"]
    color: str = DEFAULT_AVATAR["color"]
    hat: str = DEFAULT_AVATAR["hat"]


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    display_name: str | None
    avatar_url: str | None
    preferences: dict
    subscription_tier: str
    team_id: str | None
    avatar: Avatar
    is_demo: bool = False


class UpdatePreferencesRequest(BaseModel):
    preferences: dict


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    avatar: Avatar | None = None
    categories: list[str] | None = None

    @field_validator("display_name")
    @classmethod
    def name_length(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not 2 <= len(v) <= 30:
            raise ValueError("Display name must be 2-30 characters")
        return v

    @field_validator("avatar")
    @classmethod
    def avatar_valid(cls, v: Avatar | None) -> Avatar | None:
        if v is not None:
            for key, options in AVATAR_OPTIONS.items():
                if getattr(v, key) not in options:
                    raise ValueError(f"Unknown avatar {key.replace('_', ' ')}: {getattr(v, key)}")
        return v

    @field_validator("categories")
    @classmethod
    def categories_valid(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        v = [c for c in v if c in VALID_CATEGORIES]
        if not v:
            raise ValueError("Pick at least one quest category")
        return v


def to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        preferences=user.preferences or {},
        subscription_tier=user.subscription_tier,
        team_id=str(user.team_id) if user.team_id else None,
        avatar=Avatar(**avatar_of(user)),
        is_demo=is_demo_user(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return to_response(user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update display name, avatar look, and preferred quest categories."""
    if req.display_name is not None:
        user.display_name = req.display_name
    prefs = dict(user.preferences or {})  # copy so SQLAlchemy notices the JSON change
    if req.avatar is not None:
        prefs["avatar"] = req.avatar.model_dump()
    if req.categories is not None:
        prefs["categories"] = req.categories
    user.preferences = prefs
    await session.flush()
    return to_response(user)


@router.put("/preferences", response_model=UserResponse)
async def update_preferences(
    req: UpdatePreferencesRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not isinstance(req.preferences, dict):
        raise HTTPException(status_code=400, detail="Preferences must be an object")
    user.preferences = dict(req.preferences)
    await session.flush()
    return to_response(user)
