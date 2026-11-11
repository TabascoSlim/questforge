import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.engine import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Short, shareable code like "OAK-4821" (used instead of the long internal ID)
    invite_code: Mapped[str | None] = mapped_column(String(12), unique=True, index=True, nullable=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    seat_count: Mapped[int] = mapped_column(Integer, default=5)
    subscription_active: Mapped[bool] = mapped_column(Boolean, default=False)
    context: Mapped[str] = mapped_column(String(50), default="company")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    members = relationship("User", back_populates="team")
