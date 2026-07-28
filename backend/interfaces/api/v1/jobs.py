from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status

from application.dto.career_ai_schema import JobDocument
from application.dto.career_dto import (
    JobCreateRequest,
    JobDetailResponse,
    JobParseResponse,
    JobSummaryResponse,
)
from application.use_cases.jobs import (
    CreateJobUseCase,
    DeleteJobUseCase,
    GetJobUseCase,
    ListJobsUseCase,
    ParseJobUseCase,
)
from domain.interfaces.services.auth_service import AuthenticatedUser
from interfaces.api.deps import (
    get_create_job_use_case,
    get_current_user,
    get_delete_job_use_case,
    get_job_use_case,
    get_list_jobs_use_case,
    get_parse_job_use_case,
)
from interfaces.api.presenters import to_job_detail, to_job_summary

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.post(
    "",
    response_model=JobSummaryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a job description",
)
async def create_job(
    payload: JobCreateRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[CreateJobUseCase, Depends(get_create_job_use_case)],
) -> JobSummaryResponse:
    job = await use_case.execute(
        user_id=current_user.id,
        title=payload.title,
        company=payload.company,
        raw_text=payload.raw_text,
        url=str(payload.url) if payload.url else None,
    )
    return to_job_summary(job)


@router.get(
    "",
    response_model=list[JobSummaryResponse],
    summary="List the current user's jobs",
)
async def list_jobs(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[ListJobsUseCase, Depends(get_list_jobs_use_case)],
) -> list[JobSummaryResponse]:
    jobs = await use_case.execute(current_user.id)
    return [to_job_summary(job) for job in jobs]


@router.get(
    "/{job_id}",
    response_model=JobDetailResponse,
    summary="Get a job description",
    responses={404: {"description": "Job not found"}},
)
async def get_job(
    job_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[GetJobUseCase, Depends(get_job_use_case)],
) -> JobDetailResponse:
    return to_job_detail(await use_case.execute(str(job_id), current_user.id))


@router.post(
    "/{job_id}/parse",
    response_model=JobParseResponse,
    summary="Parse a job description with AI",
    responses={
        404: {"description": "Job not found"},
        429: {"description": "LLM rate limit exceeded"},
        502: {"description": "LLM provider failed"},
        503: {"description": "No OpenAI key is configured"},
    },
)
async def parse_job(
    job_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[ParseJobUseCase, Depends(get_parse_job_use_case)],
) -> JobParseResponse:
    job = await use_case.execute(str(job_id), current_user.id)
    return JobParseResponse(
        id=job.id,
        parsed_json=JobDocument.model_validate(job.parsed_json),
    )


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a job description",
    responses={404: {"description": "Job not found"}},
)
async def delete_job(
    job_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[DeleteJobUseCase, Depends(get_delete_job_use_case)],
) -> Response:
    await use_case.execute(str(job_id), current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
