from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from application.dto.career_ai_schema import JobDocument
from application.dto.resume_schema import ResumeDocument


class APIModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class JobCreateRequest(APIModel):
    title: str = Field(min_length=1, max_length=200)
    company: str = Field(default="", max_length=200)
    raw_text: str = Field(min_length=1)
    url: HttpUrl | None = None


class JobSummaryResponse(APIModel):
    id: UUID
    title: str
    company: str
    url: str | None
    created_at: datetime


class JobDetailResponse(JobSummaryResponse):
    raw_text: str
    parsed_json: JobDocument | None


class JobParseResponse(APIModel):
    id: UUID
    parsed_json: JobDocument


class ATSAnalyzeRequest(APIModel):
    resume_id: UUID
    job_id: UUID


class ATSReportResponse(APIModel):
    id: UUID
    resume_id: UUID
    job_id: UUID
    resume_version_id: UUID | None
    analysis_stage: Literal["original", "optimized"]
    match_score: float = Field(ge=0, le=100)
    missing_keywords: list[str]
    suggestions: list[str]
    strengths: list[str]
    weaknesses: list[str]
    created_at: datetime


class ResumeOptimizeRequest(APIModel):
    job_id: UUID


class ResumeVersionSummaryResponse(APIModel):
    id: UUID
    version_number: int = Field(ge=1)
    created_at: datetime


class ResumeVersionResponse(ResumeVersionSummaryResponse):
    resume_id: UUID
    source_job_id: UUID | None
    optimized_json: ResumeDocument
    diff_json: dict[str, object] | None


class ResumeOptimizationResponse(APIModel):
    version: ResumeVersionResponse
    initial_ats: ATSReportResponse
    final_ats: ATSReportResponse


class CoverLetterCreateRequest(APIModel):
    resume_id: UUID
    job_id: UUID


class CoverLetterUpdateRequest(APIModel):
    content: str = Field(min_length=1)


class CoverLetterResponse(APIModel):
    id: UUID
    resume_id: UUID
    job_id: UUID
    resume_version_id: UUID | None
    content: str
    created_at: datetime
    updated_at: datetime
