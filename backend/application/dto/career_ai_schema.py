from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from application.dto.resume_schema import ResumeDocument


class CareerSchemaModel(BaseModel):
    model_config = ConfigDict(
        extra="ignore",
        str_strip_whitespace=True,
    )


class JobDocument(CareerSchemaModel):
    title: str
    company: str
    seniority: str
    responsibilities: list[str]
    required_skills: list[str]
    preferred_skills: list[str]
    qualifications: list[str]
    keywords: list[str]


class ATSAnalysis(CareerSchemaModel):
    match_score: float = Field(ge=0, le=100)
    missing_keywords: list[str]
    suggestions: list[str]
    strengths: list[str]
    weaknesses: list[str]


class ResumeChange(CareerSchemaModel):
    section: str
    operation: Literal["added", "removed", "modified"]
    before: str
    after: str
    reason: str


class ResumeOptimization(CareerSchemaModel):
    optimized_resume: ResumeDocument
    changes: list[ResumeChange]


class CoverLetterDocument(CareerSchemaModel):
    content: str
    highlights_used: list[str]
