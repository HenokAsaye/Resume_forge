from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from string import hexdigits


class ResumeStatus(StrEnum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PARSED = "parsed"
    FAILED = "failed"


class ResumeMimeType(StrEnum):
    PDF = "application/pdf"
    DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(slots=True)
class Resume:
    id: str
    user_id: str
    name: str
    storage_path: str
    original_filename: str
    mime_type: ResumeMimeType
    size_bytes: int
    sha256: str
    storage_bucket: str = "resumes"
    status: ResumeStatus = ResumeStatus.UPLOADED
    parsed_json: dict[str, object] | None = None
    parse_error: str | None = None
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

    def __post_init__(self) -> None:
        self.id = self.id.strip()
        self.user_id = self.user_id.strip()
        self.name = self.name.strip()
        self.storage_bucket = self.storage_bucket.strip()
        self.storage_path = self.storage_path.strip()
        self.original_filename = self.original_filename.strip()
        self.sha256 = self.sha256.strip().lower()
        self.mime_type = ResumeMimeType(self.mime_type)
        self.status = ResumeStatus(self.status)

        if not self.id:
            raise ValueError("Resume ID is required")
        if not self.user_id:
            raise ValueError("Resume owner ID is required")
        if not 1 <= len(self.name) <= 100:
            raise ValueError("Resume name must contain between 1 and 100 characters")
        if not self.storage_bucket:
            raise ValueError("Storage bucket is required")
        if not self.storage_path or self.storage_path.startswith("/"):
            raise ValueError("Storage path must be a relative object path")
        if ".." in self.storage_path.split("/"):
            raise ValueError("Storage path cannot contain parent-directory segments")
        if not 1 <= len(self.original_filename) <= 255:
            raise ValueError(
                "Original filename must contain between 1 and 255 characters"
            )
        if self.size_bytes <= 0:
            raise ValueError("Resume file size must be greater than zero")
        if len(self.sha256) != 64 or any(
            character not in hexdigits for character in self.sha256
        ):
            raise ValueError("SHA-256 must be a 64-character hexadecimal value")
        if self.status is ResumeStatus.PARSED and self.parsed_json is None:
            raise ValueError("A parsed resume must contain parsed JSON")
        if self.status is ResumeStatus.FAILED and not self.parse_error:
            raise ValueError("A failed resume must contain a parse error")
        self._validate_timestamps()

    @property
    def parsed(self) -> bool:
        return self.status is ResumeStatus.PARSED and self.parsed_json is not None

    def mark_processing(self) -> None:
        if self.status not in {ResumeStatus.UPLOADED, ResumeStatus.FAILED}:
            raise ValueError(
                f"Cannot start parsing a resume with status '{self.status}'"
            )
        self.status = ResumeStatus.PROCESSING
        self.parse_error = None
        self.updated_at = utc_now()

    def mark_parsed(self, parsed_json: dict[str, object]) -> None:
        if self.status is not ResumeStatus.PROCESSING:
            raise ValueError("Only a processing resume can be marked as parsed")
        if not parsed_json:
            raise ValueError("Parsed resume JSON cannot be empty")
        self.status = ResumeStatus.PARSED
        self.parsed_json = parsed_json
        self.parse_error = None
        self.updated_at = utc_now()

    def mark_failed(self, error: str) -> None:
        if self.status is not ResumeStatus.PROCESSING:
            raise ValueError("Only a processing resume can be marked as failed")
        normalized_error = error.strip()
        if not normalized_error:
            raise ValueError("Parse error cannot be empty")
        self.status = ResumeStatus.FAILED
        self.parse_error = normalized_error
        self.updated_at = utc_now()

    def rename(self, name: str) -> None:
        normalized_name = name.strip()
        if not 1 <= len(normalized_name) <= 100:
            raise ValueError("Resume name must contain between 1 and 100 characters")
        self.name = normalized_name
        self.updated_at = utc_now()

    def _validate_timestamps(self) -> None:
        if self.created_at.tzinfo is None or self.created_at.utcoffset() is None:
            raise ValueError("created_at must be timezone-aware")
        if self.updated_at.tzinfo is None or self.updated_at.utcoffset() is None:
            raise ValueError("updated_at must be timezone-aware")
        if self.updated_at < self.created_at:
            raise ValueError("updated_at cannot be earlier than created_at")


@dataclass(slots=True)
class ResumeVersion:
    id: str
    resume_id: str
    version_number: int
    optimized_json: dict[str, object]
    source_job_id: str | None = None
    diff_json: dict[str, object] | None = None
    created_at: datetime = field(default_factory=utc_now)

    def __post_init__(self) -> None:
        self.id = self.id.strip()
        self.resume_id = self.resume_id.strip()
        self.source_job_id = self.source_job_id.strip() if self.source_job_id else None

        if not self.id:
            raise ValueError("Resume version ID is required")
        if not self.resume_id:
            raise ValueError("Parent resume ID is required")
        if self.version_number < 1:
            raise ValueError("Resume version number must be at least one")
        if not self.optimized_json:
            raise ValueError("Optimized resume JSON cannot be empty")
        if self.created_at.tzinfo is None or self.created_at.utcoffset() is None:
            raise ValueError("created_at must be timezone-aware")
