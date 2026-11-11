from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.engine import get_session
from app.models.user import User

router = APIRouter()

# bcrypt only uses the first 72 bytes of a password (and bcrypt 5+ rejects longer ones),
# so we enforce the limit up front with a clear error instead of crashing.
MAX_PASSWORD_BYTES = 72
MIN_PASSWORD_LENGTH = 8


class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

    @field_validator("email")
    @classmethod
    def email_looks_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Enter a valid email address")
        return v

    @field_validator("username")
    @classmethod
    def username_length(cls, v: str) -> str:
        v = v.strip()
        if not 3 <= len(v) <= 50:
            raise ValueError("Username must be 3-50 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
        if len(v.encode("utf-8")) > MAX_PASSWORD_BYTES:
            raise ValueError(f"Password must be at most {MAX_PASSWORD_BYTES} bytes")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    data = password.encode("utf-8")
    if len(data) > MAX_PASSWORD_BYTES:
        return False
    try:
        return bcrypt.checkpw(data, password_hash.encode("utf-8"))
    except ValueError:
        return False


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, session: AsyncSession = Depends(get_session)):
    existing = await session.execute(
        select(User).where((User.email == req.email) | (User.username == req.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email or username already taken")

    user = User(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
    )
    session.add(user)
    await session.flush()

    token = _create_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == req.email.strip().lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _create_token(str(user.id))
    return TokenResponse(access_token=token)


def demo_enabled() -> bool:
    return bool(settings.demo_user_enabled and settings.demo_email and settings.demo_password)


def is_demo_user(user: User) -> bool:
    return demo_enabled() and user.email == settings.demo_email.strip().lower()


async def get_or_create_demo_user(session: AsyncSession) -> User:
    email = settings.demo_email.strip().lower()
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            email=email,
            username=settings.demo_username,
            display_name="Demo Adventurer",
            password_hash=hash_password(settings.demo_password),
        )
        session.add(user)
        await session.flush()
    return user


@router.get("/demo")
async def demo_available():
    """Lets the UI know whether to show the one-click demo button."""
    return {"available": demo_enabled()}


@router.post("/demo", response_model=TokenResponse)
async def demo_login(session: AsyncSession = Depends(get_session)):
    """One-click login to the shared demo account (only when the demo is enabled)."""
    if not demo_enabled():
        raise HTTPException(status_code=404, detail="Demo account is not enabled")
    user = await get_or_create_demo_user(session)
    return TokenResponse(access_token=_create_token(str(user.id)))


def _create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
