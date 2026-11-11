import httpx

from app.config import settings


class GameClient:
    def __init__(self):
        self.base_url = settings.game_engine_url
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=5.0)

    async def grant_xp(
        self, user_id: str, amount: int, reason: str = "quest_complete", team_id: str | None = None
    ) -> dict:
        resp = await self.client.post("/xp/grant", json={
            "user_id": user_id,
            "amount": amount,
            "reason": reason,
            "team_id": team_id,
        })
        resp.raise_for_status()
        return resp.json()

    async def check_level(self, user_id: str) -> dict:
        resp = await self.client.get(f"/level/{user_id}")
        resp.raise_for_status()
        return resp.json()

    async def get_streak(self, user_id: str) -> dict:
        resp = await self.client.get(f"/streak/{user_id}")
        resp.raise_for_status()
        return resp.json()

    async def tick_streak(self, user_id: str) -> dict:
        resp = await self.client.post("/streak/tick", json={"user_id": user_id})
        resp.raise_for_status()
        return resp.json()

    async def get_leaderboard(self, team_id: str | None = None, limit: int = 10) -> list[dict]:
        params = {"limit": limit}
        if team_id:
            params["team_id"] = team_id
        resp = await self.client.get("/leaderboard", params=params)
        resp.raise_for_status()
        return resp.json()
