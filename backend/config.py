from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ResumeAI"
    debug: bool = True

    supabase_url: str = ""
    supabase_key: str = ""
    supabase_jwt_secret: str = ""

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    return Settings()
