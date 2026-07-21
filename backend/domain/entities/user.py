from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class User:
    id: str
    email: str
    name: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
