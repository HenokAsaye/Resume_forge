from typing import Annotated
from urllib.parse import quote
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Query,
    Request,
    Response,
    UploadFile,
    status,
)

from application.dto.career_dto import (
    ResumeOptimizationResponse,
    ResumeOptimizeRequest,
    ResumeVersionResponse,
    ResumeVersionSummaryResponse,
)
from application.dto.resume_dto import (
    ResumeDetailResponse,
    ResumeListResponse,
    ResumeUploadResponse,
)
from application.dto.resume_schema import ResumeDocument
from application.interfaces.services.resume_export_service import ResumeExportFormat
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
from config import Settings, get_settings
from domain.entities.resume import Resume
from domain.exceptions import ResumeNotParsedError
from domain.interfaces.services.auth_service import AuthenticatedUser
from interfaces.api.deps import (
    get_current_user,
    get_delete_resume_use_case,
    get_download_resume_use_case,
    get_export_resume_use_case,
    get_list_resume_versions_use_case,
    get_list_resumes_use_case,
    get_optimize_resume_use_case,
    get_parse_resume_use_case,
    get_resume_use_case,
    get_resume_version_use_case,
    get_upload_resume_use_case,
)
from interfaces.api.presenters import (
    to_ats_report,
    to_version_response,
    to_version_summary,
)

router = APIRouter(prefix="/api/v1/resumes", tags=["resumes"])


def _download_url(request: Request, resume_id: str) -> str:
    return str(
        request.url_for(
            "download_resume",
            resume_id=resume_id,
        )
    )


def _to_list_response(resume: Resume) -> ResumeListResponse:
    return ResumeListResponse(
        id=resume.id,
        name=resume.name,
        created_at=resume.created_at,
        parsed=resume.parsed,
    )


@router.post(
    "",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a resume",
    response_description="Stored resume metadata and private download endpoint",
    responses={
        400: {"description": "File is empty, corrupt, or unreadable"},
        413: {"description": "File exceeds the configured size limit"},
        415: {"description": "File extension or MIME type is not supported"},
    },
)
async def upload_resume(
    request: Request,
    file: Annotated[
        UploadFile,
        File(description="PDF or DOCX resume file"),
    ],
    name: Annotated[
        str,
        Form(min_length=1, max_length=100),
    ],
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        UploadResumeUseCase,
        Depends(get_upload_resume_use_case),
    ],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ResumeUploadResponse:
    try:
        content = await file.read(settings.resume_max_file_size_bytes + 1)
    finally:
        await file.close()

    resume = await use_case.execute(
        user_id=current_user.id,
        name=name,
        filename=file.filename or "",
        declared_content_type=file.content_type,
        content=content,
    )
    return ResumeUploadResponse(
        id=resume.id,
        name=resume.name,
        file_url=_download_url(request, resume.id),
    )


@router.get(
    "",
    response_model=list[ResumeListResponse],
    summary="List the current user's resumes",
)
async def list_resumes(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        ListResumesUseCase,
        Depends(get_list_resumes_use_case),
    ],
) -> list[ResumeListResponse]:
    resumes = await use_case.execute(current_user.id)
    return [_to_list_response(resume) for resume in resumes]


@router.get(
    "/{resume_id}",
    response_model=ResumeDetailResponse,
    summary="Get a resume",
    responses={404: {"description": "Resume not found"}},
)
async def get_resume(
    resume_id: UUID,
    request: Request,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[GetResumeUseCase, Depends(get_resume_use_case)],
) -> ResumeDetailResponse:
    resume = await use_case.execute(str(resume_id), current_user.id)
    return ResumeDetailResponse(
        id=resume.id,
        name=resume.name,
        original_file_url=_download_url(request, resume.id),
        parsed_json=resume.parsed_json,
        created_at=resume.created_at,
    )


@router.post(
    "/{resume_id}/parse",
    response_model=ResumeDetailResponse,
    summary="Extract and parse a resume with AI",
    responses={
        404: {"description": "Resume or stored file not found"},
        429: {"description": "LLM rate limit exceeded"},
        502: {"description": "Storage, extraction, or LLM provider failed"},
        503: {"description": "No OpenAI key is configured"},
    },
)
async def parse_resume(
    resume_id: UUID,
    request: Request,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        ParseResumeUseCase,
        Depends(get_parse_resume_use_case),
    ],
) -> ResumeDetailResponse:
    resume = await use_case.execute(str(resume_id), current_user.id)
    return ResumeDetailResponse(
        id=resume.id,
        name=resume.name,
        original_file_url=_download_url(request, resume.id),
        parsed_json=resume.parsed_json,
        created_at=resume.created_at,
    )


@router.get(
    "/{resume_id}/parsed",
    response_model=ResumeDocument,
    summary="Get structured resume data",
    responses={
        404: {"description": "Resume not found"},
        409: {"description": "Resume has not been parsed"},
    },
)
async def get_parsed_resume(
    resume_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[GetResumeUseCase, Depends(get_resume_use_case)],
) -> ResumeDocument:
    resume = await use_case.execute(str(resume_id), current_user.id)
    if resume.parsed_json is None:
        raise ResumeNotParsedError("Resume has not been parsed")
    return ResumeDocument.model_validate(resume.parsed_json)


@router.post(
    "/{resume_id}/optimize",
    response_model=ResumeOptimizationResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["optimization"],
    summary="Optimize a resume and compare ATS scores",
    responses={
        404: {"description": "Resume or job not found"},
        409: {"description": "Resume or job has not been parsed"},
        429: {"description": "LLM rate limit exceeded"},
        502: {"description": "LLM provider failed"},
        503: {"description": "No OpenAI key is configured"},
    },
)
async def optimize_resume(
    resume_id: UUID,
    payload: ResumeOptimizeRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        OptimizeResumeUseCase,
        Depends(get_optimize_resume_use_case),
    ],
) -> ResumeOptimizationResponse:
    result = await use_case.execute(
        str(resume_id),
        str(payload.job_id),
        current_user.id,
    )
    return ResumeOptimizationResponse(
        version=to_version_response(result.version),
        initial_ats=to_ats_report(result.initial_ats),
        final_ats=to_ats_report(result.final_ats),
    )


@router.get(
    "/{resume_id}/versions",
    response_model=list[ResumeVersionSummaryResponse],
    tags=["optimization"],
    summary="List optimized resume versions",
    responses={404: {"description": "Resume not found"}},
)
async def list_resume_versions(
    resume_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        ListResumeVersionsUseCase,
        Depends(get_list_resume_versions_use_case),
    ],
) -> list[ResumeVersionSummaryResponse]:
    versions = await use_case.execute(str(resume_id), current_user.id)
    return [to_version_summary(version) for version in versions]


@router.get(
    "/{resume_id}/versions/{version_id}",
    response_model=ResumeVersionResponse,
    tags=["optimization"],
    summary="Get an optimized resume version",
    responses={404: {"description": "Resume version not found"}},
)
async def get_resume_version(
    resume_id: UUID,
    version_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        GetResumeVersionUseCase,
        Depends(get_resume_version_use_case),
    ],
) -> ResumeVersionResponse:
    version = await use_case.execute(
        str(resume_id),
        str(version_id),
        current_user.id,
    )
    return to_version_response(version)


@router.get(
    "/{resume_id}/export",
    tags=["optimization"],
    summary="Export a parsed or optimized resume",
    responses={
        200: {
            "description": "Generated PDF or DOCX resume",
            "content": {
                "application/pdf": {},
                (
                    "application/vnd.openxmlformats-officedocument."
                    "wordprocessingml.document"
                ): {},
            },
        },
        404: {"description": "Resume or version not found"},
        409: {"description": "Resume has not been parsed"},
    },
)
async def export_resume(
    resume_id: UUID,
    export_format: Annotated[ResumeExportFormat, Query(alias="format")],
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        ExportResumeUseCase,
        Depends(get_export_resume_use_case),
    ],
    version: Annotated[int | None, Query(ge=1)] = None,
) -> Response:
    exported = await use_case.execute(
        str(resume_id),
        current_user.id,
        export_format,
        version,
    )
    encoded_filename = quote(exported.filename, safe="")
    return Response(
        content=exported.content,
        media_type=exported.media_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Content-Length": str(len(exported.content)),
        },
    )


@router.get(
    "/{resume_id}/download",
    name="download_resume",
    summary="Download the original private resume file",
    responses={
        200: {
            "description": "Original PDF or DOCX file",
            "content": {"application/octet-stream": {}},
        },
        404: {"description": "Resume or stored file not found"},
    },
)
async def download_resume(
    resume_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        DownloadResumeUseCase,
        Depends(get_download_resume_use_case),
    ],
) -> Response:
    downloaded = await use_case.execute(str(resume_id), current_user.id)
    encoded_filename = quote(downloaded.filename, safe="")
    return Response(
        content=downloaded.content,
        media_type=downloaded.content_type.value,
        headers={
            "Content-Disposition": (f"attachment; filename*=UTF-8''{encoded_filename}"),
            "Content-Length": str(len(downloaded.content)),
        },
    )


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a resume and its private file",
    responses={404: {"description": "Resume not found"}},
)
async def delete_resume(
    resume_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        DeleteResumeUseCase,
        Depends(get_delete_resume_use_case),
    ],
) -> Response:
    await use_case.execute(str(resume_id), current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
