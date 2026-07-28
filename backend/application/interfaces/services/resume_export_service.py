from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import StrEnum

from application.dto.resume_schema import ResumeDocument


class ResumeExportFormat(StrEnum):
    PDF = "pdf"
    DOCX = "docx"


@dataclass(frozen=True, slots=True)
class ExportedResume:
    filename: str
    media_type: str
    content: bytes


class ResumeExportService(ABC):
    @abstractmethod
    async def export(
        self,
        resume: ResumeDocument,
        export_format: ResumeExportFormat,
        filename: str,
    ) -> ExportedResume:
        """Render structured resume data as a downloadable file."""
