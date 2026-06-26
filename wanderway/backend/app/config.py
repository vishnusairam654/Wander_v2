"""Configuration settings and environment variables management."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env.local", ".env"),
        extra="ignore",
    )

    redis_url: str = "redis://localhost:6379"
    cors_origins: list[str] = ["http://localhost:3000"]
    rate_limit: str = "10/minute"
    cache_ttl: int = 3600
    
    gemini_api_key: str = Field(..., min_length=10, description="Gemini API key is required")
    gemini_model: str = "gemini-2.5-flash"

    @field_validator("gemini_api_key")
    @classmethod
    def validate_gemini_key(cls, v: str) -> str:
        if not v or len(v) < 10:
            raise ValueError("GEMINI_API_KEY must be set and valid")
        return v

    @field_validator("cors_origins")
    @classmethod
    def validate_cors(cls, v: list[str]) -> list[str]:
        if not v:
            return ["http://localhost:3000"]
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()
