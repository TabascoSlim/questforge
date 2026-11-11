from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.user import User
from app.api.deps import get_current_user
from app.api.auth import is_demo_user
from app.services.agent import AgentService

router = APIRouter()
agent_service = AgentService()


class QuestGenerationResponse(BaseModel):
    quests: list[dict]


@router.get("/quests/today", response_model=QuestGenerationResponse)
async def get_todays_quests(user: User = Depends(get_current_user)):
    quests = await agent_service.generate_daily_quests(user)
    return QuestGenerationResponse(quests=quests)


@router.post("/quests/regenerate", response_model=QuestGenerationResponse)
async def regenerate_quest(user: User = Depends(get_current_user)):
    quests = await agent_service.generate_daily_quests(user, force_new=True)
    return QuestGenerationResponse(quests=quests)


@router.post("/quests/reset-today", response_model=QuestGenerationResponse)
async def reset_todays_quests(user: User = Depends(get_current_user)):
    """Demo account only, so real players can't farm XP by re-completing the same day."""
    if not is_demo_user(user):
        raise HTTPException(status_code=403, detail="Resetting quests is only available on the demo account")
    return QuestGenerationResponse(quests=await agent_service.reset_today(user))


@router.get("/narrative/level-up")
async def get_level_up_message(level: int, user: User = Depends(get_current_user)):
    message = await agent_service.generate_level_up_message(user, level)
    return {"message": message}


@router.get("/narrative/streak-warning")
async def get_streak_warning(streak: int, user: User = Depends(get_current_user)):
    message = await agent_service.generate_streak_warning(user, streak)
    return {"message": message}
