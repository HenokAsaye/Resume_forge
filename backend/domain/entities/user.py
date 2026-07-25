from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class User:
    id: str
    email: str
    name: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
