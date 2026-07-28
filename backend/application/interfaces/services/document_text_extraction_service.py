from abc import ABC, abstractmethod
from dataclasses import dataclass

from domain.entities.resume import ResumeMimeType


@dataclass(frozen=True, slots=True)
class ExtractedDocument:
    text: str
    mime_type: ResumeMimeType
    page_count: int | None = None

    @property
    def character_count(self) -> int:
        return len(self.text)


class DocumentTextExtractionService(ABC):
    @abstractmethod
    async def extract(
        self,
        content: bytes,
        mime_type: ResumeMimeType,
    ) -> ExtractedDocument:
        """Extract normalized text from a supported document."""
