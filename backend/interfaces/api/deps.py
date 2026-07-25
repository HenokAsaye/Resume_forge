from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from config import Settings, get_settings
from domain.exceptions import AuthenticationError
from domain.interfaces.repositories.resume_repository import ResumeRepository
from domain.interfaces.repositories.user_repository import UserRepository
from domain.interfaces.services.auth_service import AuthenticatedUser, AuthService
from domain.interfaces.services.file_storage_service import FileStorageService
from infrastructure.auth.supabase_auth_service import SupabaseAuthService
from infrastructure.database.repositories.supabase_resume_repository import (
    SupabaseResumeRepository,
)
from infrastructure.database.repositories.supabase_user_repository import (
    SupabaseUserRepository,
)
from infrastructure.database.supabase_client import create_supabase_client
from infrastructure.file_storage.supabase_storage import SupabaseStorageService

security = HTTPBearer(auto_error=False)


def get_supabase_client(settings: Annotated[Settings, Depends(get_settings)]) -> Client:
    return create_supabase_client(settings)


def get_auth_service(
    client: Annotated[Client, Depends(get_supabase_client)],
) -> AuthService:
    return SupabaseAuthService(client)


def get_user_repo(
    client: Annotated[Client, Depends(get_supabase_client)],
) -> UserRepository:
    return SupabaseUserRepository(client)


def get_resume_repo(
    client: Annotated[Client, Depends(get_supabase_client)],
) -> ResumeRepository:
    return SupabaseResumeRepository(client)


def get_storage_service(
    client: Annotated[Client, Depends(get_supabase_client)],
) -> FileStorageService:
    return SupabaseStorageService(client)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return await auth_service.get_user(credentials.credentials)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
