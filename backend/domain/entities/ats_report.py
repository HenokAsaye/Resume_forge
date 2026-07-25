from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ATSReport:
    id: str
    resume_id: str
    job_id: str
    match_score: float
    missing_keywords: list[str] | None = None
    suggestions: list[str] | None = None
    strengths: list[str] | None = None
    weaknesses: list[str] | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
