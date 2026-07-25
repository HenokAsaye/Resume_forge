from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class JobApplication:
    id: str
    user_id: str
    job_id: str
    resume_version_id: str | None = None
    status: str = "saved"
    notes: str | None = None
    applied_at: datetime | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
