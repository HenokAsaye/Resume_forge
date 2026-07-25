from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class CoverLetter:
    id: str
    resume_id: str
    job_id: str
    content: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
