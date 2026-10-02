"""Application settings loaded from environment variables / .env."""

from functools import lru_cache
from typing import Literal, Optional

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,  # blank values in .env fall back to defaults
        extra="ignore",
    )

    openrouter_api_key: Optional[SecretStr] = None
    llm_model: Optional[str] = None
    serp_provider: Optional[str] = None
    serp_api_key: Optional[SecretStr] = None
    database_type: Literal["sqlite", "postgresql"] = "sqlite"
    database_url: Optional[str] = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
