from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Resume:
    id: str
    user_id: str
    name: str
    original_file_url: Optional[str] = None
    parsed_json: Optional[dict] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ResumeVersion:
    id: str
    resume_id: str
    version_number: int
    optimized_json: Optional[dict] = None
    diff_json: Optional[dict] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
