import uuid
from dataclasses import dataclass

from application.dto.career_ai_schema import ATSAnalysis, JobDocument
from application.dto.resume_schema import ResumeDocument
from application.interfaces.services.career_ai_services import (
    ATSAnalysisService,
    ResumeOptimizationService,
)
from domain.entities.ats_report import ATSAnalysisStage, ATSReport
from domain.entities.resume import ResumeVersion
from domain.exceptions import (
    JobNotFoundError,
    JobNotParsedError,
    ResumeNotFoundError,
    ResumeNotParsedError,
)
from domain.interfaces.repositories.ats_report_repository import ATSReportRepository
from domain.interfaces.repositories.job_repository import JobRepository
from domain.interfaces.repositories.resume_repository import ResumeRepository


@dataclass(frozen=True, slots=True)
class ResumeOptimizationResult:
    version: ResumeVersion
    initial_ats: ATSReport
    final_ats: ATSReport


class OptimizeResumeUseCase:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        job_repo: JobRepository,
        ats_repo: ATSReportRepository,
        ats_service: ATSAnalysisService,
        optimization_service: ResumeOptimizationService,
    ):
        self._resume_repo = resume_repo
        self._job_repo = job_repo
        self._ats_repo = ats_repo
        self._ats_service = ats_service
        self._optimization_service = optimization_service

    async def execute(
        self,
        resume_id: str,
        job_id: str,
        user_id: str,
    ) -> ResumeOptimizationResult:
        resume = await self._resume_repo.get_by_id(resume_id, user_id)
        if resume is None:
            raise ResumeNotFoundError("Resume not found")
        if resume.parsed_json is None:
            raise ResumeNotParsedError("Resume must be parsed before optimization")

        job = await self._job_repo.get_by_id(job_id, user_id)
        if job is None:
            raise JobNotFoundError("Job not found")
        if job.parsed_json is None:
            raise JobNotParsedError("Job must be parsed before optimization")

        resume_document = ResumeDocument.model_validate(resume.parsed_json)
        job_document = JobDocument.model_validate(job.parsed_json)

        initial_result = await self._ats_service.analyze(
            resume_document,
            job_document,
        )
        initial_report = await self._persist_report(
            user_id=user_id,
            resume_id=resume.id,
            job_id=job.id,
            analysis=initial_result.output,
            stage=ATSAnalysisStage.ORIGINAL,
        )

        optimization = await self._optimization_service.optimize(
            resume_document,
            job_document,
            initial_result.output,
        )
        versions = await self._resume_repo.list_versions(resume.id, user_id)
        next_number = (
            max(
                (version.version_number for version in versions),
                default=0,
            )
            + 1
        )
        version = await self._resume_repo.create_version(
            ResumeVersion(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                version_number=next_number,
                optimized_json=optimization.output.optimized_resume.model_dump(
                    mode="json"
                ),
                source_job_id=job.id,
                diff_json={
                    "sections": [
                        {
                            "section": change.section,
                            "op": change.operation,
                            "before": change.before,
                            "after": change.after,
                            "reason": change.reason,
                        }
                        for change in optimization.output.changes
                    ]
                },
            ),
            user_id,
        )

        final_result = await self._ats_service.analyze(
            optimization.output.optimized_resume,
            job_document,
        )
        final_report = await self._persist_report(
            user_id=user_id,
            resume_id=resume.id,
            job_id=job.id,
            analysis=final_result.output,
            stage=ATSAnalysisStage.OPTIMIZED,
            resume_version_id=version.id,
        )
        return ResumeOptimizationResult(
            version=version,
            initial_ats=initial_report,
            final_ats=final_report,
        )

    async def _persist_report(
        self,
        *,
        user_id: str,
        resume_id: str,
        job_id: str,
        analysis: ATSAnalysis,
        stage: ATSAnalysisStage,
        resume_version_id: str | None = None,
    ) -> ATSReport:
        return await self._ats_repo.create(
            ATSReport(
                id=str(uuid.uuid4()),
                user_id=user_id,
                resume_id=resume_id,
                job_id=job_id,
                resume_version_id=resume_version_id,
                analysis_stage=stage,
                match_score=analysis.match_score,
                missing_keywords=analysis.missing_keywords,
                suggestions=analysis.suggestions,
                strengths=analysis.strengths,
                weaknesses=analysis.weaknesses,
            )
        )
