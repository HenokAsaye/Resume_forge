from enum import Enum

from domain.entities.resume import ResumeMimeType
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AIProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ResumeAI"
    debug: bool = True

    supabase_url: str = ""
    supabase_publishable_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SUPABASE_PUBLISHABLE_KEY",
            "SUPABASE_ANON_KEY",
            "SUPABASE_KEY",
        ),
    )
    supabase_secret_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SUPABASE_SECRET_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
        ),
    )

    ai_timeout_seconds: float = Field(default=60.0, gt=0)
    ai_max_output_tokens: int = Field(default=4000, gt=0)

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    resume_storage_bucket: str = "resumes"
    resume_max_file_size_bytes: int = Field(default=6 * 1024 * 1024, gt=0)
    resume_max_uncompressed_size_bytes: int = Field(
        default=50 * 1024 * 1024,
        gt=0,
    )
    resume_allowed_extensions: str = ".pdf,.docx"
    resume_allowed_mime_types: str = (
        "application/pdf,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]

    @property
    def resume_allowed_extension_set(self) -> frozenset[str]:
        return frozenset(
            self._normalize_extension(extension)
            for extension in self.resume_allowed_extensions.split(",")
            if extension.strip()
        )

    @property
    def resume_allowed_mime_type_set(self) -> frozenset[ResumeMimeType]:
        return frozenset(
            ResumeMimeType(mime_type.strip().lower())
            for mime_type in self.resume_allowed_mime_types.split(",")
            if mime_type.strip()
        )

    @staticmethod
    def _normalize_extension(extension: str) -> str:
        normalized = extension.strip().lower()
        return normalized if normalized.startswith(".") else f".{normalized}"


def get_settings() -> Settings:
    return Settings()
