from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum


class ATSAnalysisStage(StrEnum):
    ORIGINAL = "original"
    OPTIMIZED = "optimized"


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(slots=True)
class ATSReport:
    id: str
    user_id: str
    resume_id: str
    job_id: str
    match_score: float
    missing_keywords: list[str]
    suggestions: list[str]
    strengths: list[str]
    weaknesses: list[str]
    analysis_stage: ATSAnalysisStage = ATSAnalysisStage.ORIGINAL
    resume_version_id: str | None = None
    created_at: datetime = field(default_factory=utc_now)

    def __post_init__(self) -> None:
        self.analysis_stage = ATSAnalysisStage(self.analysis_stage)
        if not 0 <= self.match_score <= 100:
            raise ValueError("ATS match score must be between 0 and 100")
        if self.created_at.tzinfo is None:
            raise ValueError("ATS report timestamp must be timezone-aware")
