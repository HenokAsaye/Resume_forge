from abc import ABC, abstractmethod
from dataclasses import dataclass

from domain.entities.resume import ResumeMimeType


@dataclass(frozen=True, slots=True)
class FileValidationPolicy:
    max_size_bytes: int
    max_uncompressed_size_bytes: int
    allowed_extensions: frozenset[str]
    allowed_mime_types: frozenset[ResumeMimeType]

    def __post_init__(self) -> None:
        if self.max_size_bytes <= 0:
            raise ValueError("Maximum file size must be greater than zero")
        if self.max_uncompressed_size_bytes < self.max_size_bytes:
            raise ValueError(
                "Maximum uncompressed size cannot be smaller than upload size"
            )
        if not self.allowed_extensions:
            raise ValueError("At least one file extension must be allowed")
        if not self.allowed_mime_types:
            raise ValueError("At least one MIME type must be allowed")


@dataclass(frozen=True, slots=True)
class ValidatedFile:
    original_filename: str
    extension: str
    mime_type: ResumeMimeType
    size_bytes: int
    sha256: str
    content: bytes


class FileValidationService(ABC):
    @abstractmethod
    async def validate(
        self,
        filename: str,
        declared_content_type: str | None,
        content: bytes,
    ) -> ValidatedFile:
        """Validate and describe an uploaded resume file."""
