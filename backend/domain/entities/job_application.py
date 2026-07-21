from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class JobApplication:
    id: str
    user_id: str
    job_id: str
    resume_version_id: Optional[str] = None
    status: str = "saved"
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
