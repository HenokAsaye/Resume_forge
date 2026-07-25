from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class JobDescription:
    id: str
    user_id: str
    title: str
    company: str | None = None
    raw_text: str | None = None
    parsed_json: dict | None = None
    url: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
