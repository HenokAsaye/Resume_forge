from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Resume:
    id: str
    user_id: str
    name: str
    original_file_url: str | None = None
    parsed_json: dict | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ResumeVersion:
    id: str
    resume_id: str
    version_number: int
    optimized_json: dict | None = None
    diff_json: dict | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
