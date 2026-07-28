import uuid

from application.dto.career_ai_schema import JobDocument
from application.dto.resume_schema import ResumeDocument
from application.interfaces.services.career_ai_services import ATSAnalysisService
from domain.entities.ats_report import ATSAnalysisStage, ATSReport
from domain.exceptions import (
    ATSReportNotFoundError,
    JobNotFoundError,
    JobNotParsedError,
    ResumeNotFoundError,
    ResumeNotParsedError,
)
from domain.interfaces.repositories.ats_report_repository import ATSReportRepository
from domain.interfaces.repositories.job_repository import JobRepository
from domain.interfaces.repositories.resume_repository import ResumeRepository


class AnalyzeATSUseCase:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        job_repo: JobRepository,
        ats_repo: ATSReportRepository,
        ats_service: ATSAnalysisService,
    ):
        self._resume_repo = resume_repo
        self._job_repo = job_repo
        self._ats_repo = ats_repo
        self._ats_service = ats_service

    async def execute(
        self,
        resume_id: str,
        job_id: str,
        user_id: str,
    ) -> ATSReport:
        resume = await self._resume_repo.get_by_id(resume_id, user_id)
        if resume is None:
            raise ResumeNotFoundError("Resume not found")
        if resume.parsed_json is None:
            raise ResumeNotParsedError("Resume must be parsed before ATS analysis")

        job = await self._job_repo.get_by_id(job_id, user_id)
        if job is None:
            raise JobNotFoundError("Job not found")
        if job.parsed_json is None:
            raise JobNotParsedError("Job must be parsed before ATS analysis")

        result = await self._ats_service.analyze(
            ResumeDocument.model_validate(resume.parsed_json),
            JobDocument.model_validate(job.parsed_json),
        )
        analysis = result.output
        return await self._ats_repo.create(
            ATSReport(
                id=str(uuid.uuid4()),
                user_id=user_id,
                resume_id=resume.id,
                job_id=job.id,
                analysis_stage=ATSAnalysisStage.ORIGINAL,
                match_score=analysis.match_score,
                missing_keywords=analysis.missing_keywords,
                suggestions=analysis.suggestions,
                strengths=analysis.strengths,
                weaknesses=analysis.weaknesses,
            )
        )


class ListATSReportsUseCase:
    def __init__(self, ats_repo: ATSReportRepository):
        self._ats_repo = ats_repo

    async def execute(
        self,
        user_id: str,
        resume_id: str | None = None,
        job_id: str | None = None,
    ) -> list[ATSReport]:
        return await self._ats_repo.list_by_user(user_id, resume_id, job_id)


class GetATSReportUseCase:
    def __init__(self, ats_repo: ATSReportRepository):
        self._ats_repo = ats_repo

    async def execute(self, report_id: str, user_id: str) -> ATSReport:
        report = await self._ats_repo.get_by_id(report_id, user_id)
        if report is None:
            raise ATSReportNotFoundError("ATS report not found")
        return report
