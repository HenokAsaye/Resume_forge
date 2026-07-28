from dataclasses import dataclass, field
from datetime import UTC, datetime


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(slots=True)
class CoverLetter:
    id: str
    user_id: str
    resume_id: str
    job_id: str
    content: str
    resume_version_id: str | None = None
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

    def __post_init__(self) -> None:
        self.content = self.content.strip()
        if not self.content:
            raise ValueError("Cover letter content is required")
        if self.created_at.tzinfo is None or self.updated_at.tzinfo is None:
            raise ValueError("Cover letter timestamps must be timezone-aware")

    def edit(self, content: str) -> None:
        normalized = content.strip()
        if not normalized:
            raise ValueError("Cover letter content is required")
        self.content = normalized
        self.updated_at = utc_now()
