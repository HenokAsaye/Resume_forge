import logging
from collections.abc import AsyncIterator
from typing import Annotated

from application.exceptions import AIConfigurationError
from application.interfaces.services.career_ai_services import (
    ATSAnalysisService,
    CoverLetterGenerationService,
    JobParsingService,
    ResumeOptimizationService,
)
from application.interfaces.services.document_text_extraction_service import (
    DocumentTextExtractionService,
)
from application.interfaces.services.file_storage_service import FileStorageService
from application.interfaces.services.file_validation_service import (
    FileValidationPolicy,
    FileValidationService,
)
from application.interfaces.services.resume_export_service import ResumeExportService
from application.interfaces.services.resume_parsing_service import ResumeParsingService
from application.interfaces.services.structured_generation_service import (
    StructuredGenerationService,
)
from application.services import (
    StructuredATSAnalysisService,
    StructuredCoverLetterGenerationService,
    StructuredJobParsingService,
    StructuredResumeOptimizationService,
    StructuredResumeParsingService,
)
from application.use_cases.ats import (
    AnalyzeATSUseCase,
    GetATSReportUseCase,
    ListATSReportsUseCase,
)
from application.use_cases.cover_letters import (
    CreateCoverLetterUseCase,
    DeleteCoverLetterUseCase,
    GetCoverLetterUseCase,
    ListCoverLettersUseCase,
    UpdateCoverLetterUseCase,
)
from application.use_cases.jobs import (
    CreateJobUseCase,
    DeleteJobUseCase,
    GetJobUseCase,
    ListJobsUseCase,
    ParseJobUseCase,
)
from application.use_cases.resume import (
    DeleteResumeUseCase,
    DownloadResumeUseCase,
    ExportResumeUseCase,
    GetResumeUseCase,
    GetResumeVersionUseCase,
    ListResumesUseCase,
    ListResumeVersionsUseCase,
    OptimizeResumeUseCase,
    ParseResumeUseCase,
    UploadResumeUseCase,
)
from config import AIProvider, Settings, get_settings
from domain.exceptions import AuthenticationError
from domain.interfaces.repositories.ats_report_repository import ATSReportRepository
from domain.interfaces.repositories.cover_letter_repository import (
    CoverLetterRepository,
)
from domain.interfaces.repositories.job_repository import JobRepository
from domain.interfaces.repositories.resume_repository import ResumeRepository
from domain.interfaces.repositories.user_repository import UserRepository
from domain.interfaces.services.auth_service import AuthenticatedUser, AuthService
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from infrastructure.ai import (
    AIProviderConfig,
    GeminiStructuredService,
    OpenAIStructuredService,
)
from infrastructure.auth.supabase_auth_service import SupabaseAuthService
from infrastructure.database.repositories.supabase_ats_report_repository import (
    SupabaseATSReportRepository,
)
from infrastructure.database.repositories.supabase_cover_letter_repository import (
    SupabaseCoverLetterRepository,
)
from infrastructure.database.repositories.supabase_job_repository import (
    SupabaseJobRepository,
)
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
from infrastructure.document_export import ResumeDocumentExportService
from infrastructure.file_storage.supabase_storage import SupabaseStorageService
from infrastructure.file_validation.resume_file_validator import (
    ResumeFileValidationService,
)
from infrastructure.text_extraction import ResumeTextExtractionService

from supabase import AsyncClient, Client

security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


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


def get_job_repo(
    client: Annotated[
        AsyncClient,
        Depends(get_authenticated_async_supabase_client),
    ],
) -> JobRepository:
    return SupabaseJobRepository(client)


def get_ats_report_repo(
    client: Annotated[
        AsyncClient,
        Depends(get_authenticated_async_supabase_client),
    ],
) -> ATSReportRepository:
    return SupabaseATSReportRepository(client)


def get_cover_letter_repo(
    client: Annotated[
        AsyncClient,
        Depends(get_authenticated_async_supabase_client),
    ],
) -> CoverLetterRepository:
    return SupabaseCoverLetterRepository(client)


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


def get_ai_provider_config(
    settings: Annotated[Settings, Depends(get_settings)],
    request_provider: Annotated[
        AIProvider | None,
        Header(alias="X-AI-Provider"),
    ] = None,
    request_api_key: Annotated[
        str | None,
        Header(alias="X-AI-API-Key"),
    ] = None,
) -> AIProviderConfig:
    normalized_request_key = (request_api_key or "").strip()
    if request_provider is not None and not normalized_request_key:
        raise AIConfigurationError("X-AI-Provider requires X-AI-API-Key")

    if normalized_request_key:
        config = AIProviderConfig.for_provider(
            settings,
            request_provider or AIProvider.GEMINI,
            normalized_request_key,
        )
        credential_source = "request"
    else:
        config = AIProviderConfig.from_settings(settings)
        credential_source = "server"

    if not config.api_key:
        raise AIConfigurationError(
            "No AI provider is configured; set GEMINI_API_KEY or "
            "OPENAI_API_KEY, or provide X-AI-API-Key"
        )
    if not config.model:
        raise AIConfigurationError(
            f"{config.provider.value.title()} model is not configured; "
            f"set {config.provider.value.upper()}_MODEL"
        )
    logger.info(
        "AI provider selected: provider=%s credential_source=%s",
        config.provider.value,
        credential_source,
    )
    return config


def get_structured_generation_service(
    config: Annotated[AIProviderConfig, Depends(get_ai_provider_config)],
) -> StructuredGenerationService:
    service_type = (
        OpenAIStructuredService
        if config.provider is AIProvider.OPENAI
        else GeminiStructuredService
    )
    return service_type(
        config.api_key,
        config.model,
        max_output_tokens=config.max_output_tokens,
        timeout_seconds=config.timeout_seconds,
    )


def get_resume_parsing_service(
    generator: Annotated[
        StructuredGenerationService,
        Depends(get_structured_generation_service),
    ],
) -> ResumeParsingService:
    return StructuredResumeParsingService(generator)


def get_job_parsing_service(
    generator: Annotated[
        StructuredGenerationService,
        Depends(get_structured_generation_service),
    ],
) -> JobParsingService:
    return StructuredJobParsingService(generator)


def get_ats_analysis_service(
    generator: Annotated[
        StructuredGenerationService,
        Depends(get_structured_generation_service),
    ],
) -> ATSAnalysisService:
    return StructuredATSAnalysisService(generator)


def get_resume_optimization_service(
    generator: Annotated[
        StructuredGenerationService,
        Depends(get_structured_generation_service),
    ],
) -> ResumeOptimizationService:
    return StructuredResumeOptimizationService(generator)


def get_cover_letter_generation_service(
    generator: Annotated[
        StructuredGenerationService,
        Depends(get_structured_generation_service),
    ],
) -> CoverLetterGenerationService:
    return StructuredCoverLetterGenerationService(generator)


def get_text_extraction_service() -> DocumentTextExtractionService:
    return ResumeTextExtractionService()


def get_resume_export_service() -> ResumeExportService:
    return ResumeDocumentExportService()


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


def get_parse_resume_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
    storage: Annotated[FileStorageService, Depends(get_storage_service)],
    extractor: Annotated[
        DocumentTextExtractionService,
        Depends(get_text_extraction_service),
    ],
    parser: Annotated[ResumeParsingService, Depends(get_resume_parsing_service)],
) -> ParseResumeUseCase:
    return ParseResumeUseCase(resume_repo, storage, extractor, parser)


def get_list_resume_versions_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
) -> ListResumeVersionsUseCase:
    return ListResumeVersionsUseCase(resume_repo)


def get_resume_version_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
) -> GetResumeVersionUseCase:
    return GetResumeVersionUseCase(resume_repo)


def get_export_resume_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
    exporter: Annotated[
        ResumeExportService,
        Depends(get_resume_export_service),
    ],
) -> ExportResumeUseCase:
    return ExportResumeUseCase(resume_repo, exporter)


def get_optimize_resume_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
    job_repo: Annotated[JobRepository, Depends(get_job_repo)],
    ats_repo: Annotated[ATSReportRepository, Depends(get_ats_report_repo)],
    ats_service: Annotated[
        ATSAnalysisService,
        Depends(get_ats_analysis_service),
    ],
    optimization_service: Annotated[
        ResumeOptimizationService,
        Depends(get_resume_optimization_service),
    ],
) -> OptimizeResumeUseCase:
    return OptimizeResumeUseCase(
        resume_repo,
        job_repo,
        ats_repo,
        ats_service,
        optimization_service,
    )


def get_create_job_use_case(
    job_repo: Annotated[JobRepository, Depends(get_job_repo)],
) -> CreateJobUseCase:
    return CreateJobUseCase(job_repo)


def get_list_jobs_use_case(
    job_repo: Annotated[JobRepository, Depends(get_job_repo)],
) -> ListJobsUseCase:
    return ListJobsUseCase(job_repo)


def get_job_use_case(
    job_repo: Annotated[JobRepository, Depends(get_job_repo)],
) -> GetJobUseCase:
    return GetJobUseCase(job_repo)


def get_delete_job_use_case(
    job_repo: Annotated[JobRepository, Depends(get_job_repo)],
) -> DeleteJobUseCase:
    return DeleteJobUseCase(job_repo)


def get_parse_job_use_case(
    job_repo: Annotated[JobRepository, Depends(get_job_repo)],
    parser: Annotated[JobParsingService, Depends(get_job_parsing_service)],
) -> ParseJobUseCase:
    return ParseJobUseCase(job_repo, parser)


def get_analyze_ats_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
    job_repo: Annotated[JobRepository, Depends(get_job_repo)],
    ats_repo: Annotated[ATSReportRepository, Depends(get_ats_report_repo)],
    ats_service: Annotated[
        ATSAnalysisService,
        Depends(get_ats_analysis_service),
    ],
) -> AnalyzeATSUseCase:
    return AnalyzeATSUseCase(resume_repo, job_repo, ats_repo, ats_service)


def get_list_ats_reports_use_case(
    ats_repo: Annotated[ATSReportRepository, Depends(get_ats_report_repo)],
) -> ListATSReportsUseCase:
    return ListATSReportsUseCase(ats_repo)


def get_ats_report_use_case(
    ats_repo: Annotated[ATSReportRepository, Depends(get_ats_report_repo)],
) -> GetATSReportUseCase:
    return GetATSReportUseCase(ats_repo)


def get_create_cover_letter_use_case(
    resume_repo: Annotated[ResumeRepository, Depends(get_resume_repo)],
    job_repo: Annotated[JobRepository, Depends(get_job_repo)],
    cover_letter_repo: Annotated[
        CoverLetterRepository,
        Depends(get_cover_letter_repo),
    ],
    generation_service: Annotated[
        CoverLetterGenerationService,
        Depends(get_cover_letter_generation_service),
    ],
) -> CreateCoverLetterUseCase:
    return CreateCoverLetterUseCase(
        resume_repo,
        job_repo,
        cover_letter_repo,
        generation_service,
    )


def get_list_cover_letters_use_case(
    cover_letter_repo: Annotated[
        CoverLetterRepository,
        Depends(get_cover_letter_repo),
    ],
) -> ListCoverLettersUseCase:
    return ListCoverLettersUseCase(cover_letter_repo)


def get_cover_letter_use_case(
    cover_letter_repo: Annotated[
        CoverLetterRepository,
        Depends(get_cover_letter_repo),
    ],
) -> GetCoverLetterUseCase:
    return GetCoverLetterUseCase(cover_letter_repo)


def get_update_cover_letter_use_case(
    cover_letter_repo: Annotated[
        CoverLetterRepository,
        Depends(get_cover_letter_repo),
    ],
) -> UpdateCoverLetterUseCase:
    return UpdateCoverLetterUseCase(cover_letter_repo)


def get_delete_cover_letter_use_case(
    cover_letter_repo: Annotated[
        CoverLetterRepository,
        Depends(get_cover_letter_repo),
    ],
) -> DeleteCoverLetterUseCase:
    return DeleteCoverLetterUseCase(cover_letter_repo)


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
