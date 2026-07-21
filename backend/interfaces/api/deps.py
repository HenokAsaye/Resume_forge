from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from config import Settings, get_settings
from domain.interfaces.repositories.resume_repository import ResumeRepository
from domain.interfaces.repositories.user_repository import UserRepository
from domain.interfaces.services.file_storage_service import FileStorageService
from infrastructure.database.repositories.supabase_resume_repository import SupabaseResumeRepository
from infrastructure.database.repositories.supabase_user_repository import SupabaseUserRepository
from infrastructure.database.supabase_client import create_supabase_client
from infrastructure.file_storage.supabase_storage import SupabaseStorageService

security = HTTPBearer()


def get_supabase_client(settings: Annotated[Settings, Depends(get_settings)]) -> Client:
    return create_supabase_client(settings)


def get_user_repo(client: Annotated[Client, Depends(get_supabase_client)]) -> UserRepository:
    return SupabaseUserRepository(client)


def get_resume_repo(client: Annotated[Client, Depends(get_supabase_client)]) -> ResumeRepository:
    return SupabaseResumeRepository(client)


def get_storage_service(client: Annotated[Client, Depends(get_supabase_client)]) -> FileStorageService:
    return SupabaseStorageService(client)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    supabase: Annotated[Client, Depends(get_supabase_client)],
) -> dict:
    try:
        user = supabase.auth.get_user(credentials.credentials)
        return user.user.model_dump()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
