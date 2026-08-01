from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from application.dto.career_dto import ATSAnalyzeRequest, ATSReportResponse
from application.use_cases.ats import (
    AnalyzeATSUseCase,
    GetATSReportUseCase,
    ListATSReportsUseCase,
)
from domain.interfaces.services.auth_service import AuthenticatedUser
from interfaces.api.deps import (
    get_analyze_ats_use_case,
    get_ats_report_use_case,
    get_current_user,
    get_list_ats_reports_use_case,
)
from interfaces.api.presenters import to_ats_report

router = APIRouter(prefix="/api/v1/ats", tags=["ats"])


@router.post(
    "/analyze",
    response_model=ATSReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze a resume against a job",
    responses={
        404: {"description": "Resume or job not found"},
        409: {"description": "Resume or job has not been parsed"},
        429: {"description": "LLM rate limit exceeded"},
        502: {"description": "LLM provider failed"},
        503: {"description": "No OpenAI key is configured"},
    },
)
async def analyze_ats(
    payload: ATSAnalyzeRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[AnalyzeATSUseCase, Depends(get_analyze_ats_use_case)],
) -> ATSReportResponse:
    report = await use_case.execute(
        str(payload.resume_id),
        str(payload.job_id),
        current_user.id,
    )
    return to_ats_report(report)


@router.get(
    "/reports",
    response_model=list[ATSReportResponse],
    summary="List ATS reports",
)
async def list_ats_reports(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        ListATSReportsUseCase,
        Depends(get_list_ats_reports_use_case),
    ],
    resume_id: Annotated[UUID | None, Query()] = None,
    job_id: Annotated[UUID | None, Query()] = None,
) -> list[ATSReportResponse]:
    reports = await use_case.execute(
        current_user.id,
        str(resume_id) if resume_id else None,
        str(job_id) if job_id else None,
    )
    return [to_ats_report(report) for report in reports]


@router.get(
    "/reports/{report_id}",
    response_model=ATSReportResponse,
    summary="Get an ATS report",
    responses={404: {"description": "ATS report not found"}},
)
async def get_ats_report(
    report_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    use_case: Annotated[
        GetATSReportUseCase,
        Depends(get_ats_report_use_case),
    ],
) -> ATSReportResponse:
    return to_ats_report(await use_case.execute(str(report_id), current_user.id))
