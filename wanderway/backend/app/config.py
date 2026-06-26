"""Configuration settings and environment variables management."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env.local", ".env"),
        extra="ignore",
    )

    redis_url: str = "redis://localhost:6379"
    cors_origins: list[str] = ["http://localhost:3000"]
    rate_limit: str = "10/minute"
    cache_ttl: int = 3600
    
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
