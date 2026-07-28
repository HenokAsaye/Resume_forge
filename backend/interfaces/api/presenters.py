from application.dto.career_ai_schema import JobDocument
from application.dto.career_dto import (
    ATSReportResponse,
    CoverLetterResponse,
    JobDetailResponse,
    JobSummaryResponse,
    ResumeVersionResponse,
    ResumeVersionSummaryResponse,
)
from application.dto.resume_schema import ResumeDocument
from domain.entities.ats_report import ATSReport
from domain.entities.cover_letter import CoverLetter
from domain.entities.job_description import JobDescription
from domain.entities.resume import ResumeVersion


def to_job_summary(job: JobDescription) -> JobSummaryResponse:
    return JobSummaryResponse(
        id=job.id,
        title=job.title,
        company=job.company,
        url=job.url,
        created_at=job.created_at,
    )


def to_job_detail(job: JobDescription) -> JobDetailResponse:
    return JobDetailResponse(
        **to_job_summary(job).model_dump(),
        raw_text=job.raw_text,
        parsed_json=(
            JobDocument.model_validate(job.parsed_json)
            if job.parsed_json is not None
            else None
        ),
    )


def to_ats_report(report: ATSReport) -> ATSReportResponse:
    return ATSReportResponse(
        id=report.id,
        resume_id=report.resume_id,
        job_id=report.job_id,
        resume_version_id=report.resume_version_id,
        analysis_stage=report.analysis_stage.value,
        match_score=report.match_score,
        missing_keywords=report.missing_keywords,
        suggestions=report.suggestions,
        strengths=report.strengths,
        weaknesses=report.weaknesses,
        created_at=report.created_at,
    )


def to_version_summary(version: ResumeVersion) -> ResumeVersionSummaryResponse:
    return ResumeVersionSummaryResponse(
        id=version.id,
        version_number=version.version_number,
        created_at=version.created_at,
    )


def to_version_response(version: ResumeVersion) -> ResumeVersionResponse:
    return ResumeVersionResponse(
        **to_version_summary(version).model_dump(),
        resume_id=version.resume_id,
        source_job_id=version.source_job_id,
        optimized_json=ResumeDocument.model_validate(version.optimized_json),
        diff_json=version.diff_json,
    )


def to_cover_letter(letter: CoverLetter) -> CoverLetterResponse:
    return CoverLetterResponse(
        id=letter.id,
        resume_id=letter.resume_id,
        job_id=letter.job_id,
        resume_version_id=letter.resume_version_id,
        content=letter.content,
        created_at=letter.created_at,
        updated_at=letter.updated_at,
    )
