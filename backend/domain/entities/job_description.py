from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class JobDescription:
    id: str
    user_id: str
    title: str
    company: Optional[str] = None
    raw_text: Optional[str] = None
    parsed_json: Optional[dict] = None
    url: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
