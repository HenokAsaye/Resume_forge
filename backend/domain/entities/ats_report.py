from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class ATSReport:
    id: str
    resume_id: str
    job_id: str
    match_score: float
    missing_keywords: Optional[list[str]] = None
    suggestions: Optional[list[str]] = None
    strengths: Optional[list[str]] = None
    weaknesses: Optional[list[str]] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
