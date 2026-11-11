from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    postgres_user: str = "questforge"
    postgres_password: str = "questforge"
    postgres_db: str = "questforge"
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    redis_host: str = "localhost"
    redis_port: int = 6379

    jwt_secret: str = "dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    game_engine_url: str = "http://localhost:8001"

    # "anthropic" or "openai"; with no matching API key, preset quests are used instead
    llm_provider: str = "anthropic"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-5-5"

    # Local demo account so anyone running the project can log in right away.
    # For local/demo use only: turn this off for any real deployment.
    demo_user_enabled: bool = False
    demo_email: str = ""
    demo_password: str = ""
    demo_username: str = "demo_adventurer"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}"


settings = Settings()
