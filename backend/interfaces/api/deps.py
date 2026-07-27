from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import AsyncClient, Client

from application.interfaces.services.file_storage_service import FileStorageService
from application.interfaces.services.file_validation_service import (
    FileValidationPolicy,
    FileValidationService,
)
from application.use_cases.resume import (
    DeleteResumeUseCase,
    DownloadResumeUseCase,
    GetResumeUseCase,
    ListResumesUseCase,
    UploadResumeUseCase,
)
from config import Settings, get_settings
from domain.exceptions import AuthenticationError
from domain.interfaces.repositories.resume_repository import ResumeRepository
from domain.interfaces.repositories.user_repository import UserRepository
from domain.interfaces.services.auth_service import AuthenticatedUser, AuthService
from infrastructure.auth.supabase_auth_service import SupabaseAuthService
from infrastructure.database.repositories.supabase_resume_repository import (
    SupabaseResumeRepository,
)
from infrastructure.database.repositories.supabase_user_repository import (
    SupabaseUserRepository,
)
from infrastructure.database.supabase_client import (
    create_async_supabase_client,
    create_supabase_client,
)
from infrastructure.file_storage.supabase_storage import SupabaseStorageService
from infrastructure.file_validation.resume_file_validator import (
    ResumeFileValidationService,
)

security = HTTPBearer(auto_error=False)


def get_supabase_client(settings: Annotated[Settings, Depends(get_settings)]) -> Client:
    return create_supabase_client(settings)


def get_auth_service(
    client: Annotated[Client, Depends(get_supabase_client)],
) -> AuthService:
    return SupabaseAuthService(client)


async def get_access_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


def get_user_repo(
    client: Annotated[Client, Depends(get_supabase_client)],
) -> UserRepository:
    return SupabaseUserRepository(client)


async def get_authenticated_async_supabase_client(
    settings: Annotated[Settings, Depends(get_settings)],
    access_token: Annotated[str, Depends(get_access_token)],
) -> AsyncIterator[AsyncClient]:
    client = await create_async_supabase_client(settings)
    client.options.headers["Authorization"] = f"Bearer {access_token}"
    client.postgrest.auth(access_token)
    try:
        yield client
    finally:
        await client.postgrest.aclose()
        await client.auth.close()


def get_resume_repo(
    client: Annotated[
        AsyncClient,
        Depends(get_authenticated_async_supabase_client),
    ],
) -> ResumeRepository:
    return SupabaseResumeRepository(client)


def get_storage_service(
    client: Annotated[
        AsyncClient,
        Depends(get_authenticated_async_supabase_client),
    ],
) -> FileStorageService:
    return SupabaseStorageService(client)


def get_file_validation_policy(
    settings: Annotated[Settings, Depends(get_settings)],
) -> FileValidationPolicy:
    return FileValidationPolicy(
        max_size_bytes=settings.resume_max_file_size_bytes,
        max_uncompressed_size_bytes=(settings.resume_max_uncompressed_size_bytes),
        allowed_extensions=settings.resume_allowed_extension_set,
        allowed_mime_types=settings.resume_allowed_mime_type_set,
    )


def get_file_validation_service(
    policy: Annotated[FileValidationPolicy, Depends(get_file_validation_policy)],
) -> FileValidationService:
    return ResumeFileValidationService(policy)


def get_upload_resume_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
    storage: Annotated[FileStorageService, Depends(get_storage_service)],
    validator: Annotated[
        FileValidationService,
        Depends(get_file_validation_service),
    ],
    settings: Annotated[Settings, Depends(get_settings)],
) -> UploadResumeUseCase:
    return UploadResumeUseCase(
        resume_repo=resume_repo,
        storage=storage,
        validator=validator,
        storage_bucket=settings.resume_storage_bucket,
    )


def get_list_resumes_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
) -> ListResumesUseCase:
    return ListResumesUseCase(resume_repo)


def get_resume_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
) -> GetResumeUseCase:
    return GetResumeUseCase(resume_repo)


def get_download_resume_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
    storage: Annotated[FileStorageService, Depends(get_storage_service)],
) -> DownloadResumeUseCase:
    return DownloadResumeUseCase(resume_repo, storage)


def get_delete_resume_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
    storage: Annotated[FileStorageService, Depends(get_storage_service)],
) -> DeleteResumeUseCase:
    return DeleteResumeUseCase(resume_repo, storage)


async def get_current_user(
    access_token: Annotated[str, Depends(get_access_token)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthenticatedUser:
    try:
        return await auth_service.get_user(access_token)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
