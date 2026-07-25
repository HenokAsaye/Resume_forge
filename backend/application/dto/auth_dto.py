from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "jane@example.com",
                "password": "secret123",
                "name": "Jane Doe",
            }
        }
    )

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=100)

    @field_validator("email", "name", mode="before")
    @classmethod
    def normalize_identity_fields(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class LoginRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "jane@example.com",
                "password": "secret123",
            }
        }
    )

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class RefreshRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"refresh_token": "supabase-refresh-token"}}
    )

    refresh_token: str = Field(min_length=1)

    @field_validator("refresh_token")
    @classmethod
    def reject_blank_refresh_token(cls, value: str) -> str:
        token = value.strip()
        if not token:
            raise ValueError("refresh_token must not be blank")
        return token


class AuthResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOi...",
                "refresh_token": "supabase-refresh-token",
                "expires_in": 3600,
                "token_type": "bearer",
                "user_id": "3f9c0000-0000-0000-0000-000000000001",
                "email": "jane@example.com",
                "name": "Jane Doe",
                "requires_email_confirmation": False,
            }
        }
    )

    access_token: str | None
    refresh_token: str | None
    expires_in: int | None
    token_type: str = "bearer"
    user_id: str
    email: EmailStr
    name: str | None = None
    requires_email_confirmation: bool = False


class CurrentUserResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "3f9c0000-0000-0000-0000-000000000001",
                "email": "jane@example.com",
                "name": "Jane Doe",
                "created_at": "2026-07-25T10:00:00Z",
            }
        }
    )

    id: str
    email: EmailStr
    name: str | None = None
    created_at: datetime
