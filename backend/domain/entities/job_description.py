from dataclasses import dataclass, field
from datetime import UTC, datetime


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(slots=True)
class JobDescription:
    id: str
    user_id: str
    title: str
    company: str
    raw_text: str
    url: str | None = None
    parsed_json: dict[str, object] | None = None
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

    def __post_init__(self) -> None:
        self.id = self.id.strip()
        self.user_id = self.user_id.strip()
        self.title = self.title.strip()
        self.company = self.company.strip()
        self.raw_text = self.raw_text.strip()
        self.url = self.url.strip() if self.url else None

        if not self.id or not self.user_id:
            raise ValueError("Job ID and owner ID are required")
        if not self.title:
            raise ValueError("Job title is required")
        if not self.raw_text:
            raise ValueError("Job description text is required")
        if self.created_at.tzinfo is None or self.updated_at.tzinfo is None:
            raise ValueError("Job timestamps must be timezone-aware")

    def mark_parsed(self, parsed_json: dict[str, object]) -> None:
        if not parsed_json:
            raise ValueError("Parsed job JSON cannot be empty")
        self.parsed_json = parsed_json
        self.updated_at = utc_now()
