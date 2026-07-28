from abc import ABC, abstractmethod
from dataclasses import dataclass

from application.dto.resume_schema import ResumeDocument


@dataclass(frozen=True, slots=True)
class ResumeParsingResult:
    resume: ResumeDocument
    model: str
    input_tokens: int
    output_tokens: int
    provider_request_id: str | None = None

    def __post_init__(self) -> None:
        if not self.model.strip():
            raise ValueError("Model name is required")

        if self.input_tokens < 0:
            raise ValueError("Input token count cannot be negative")

        if self.output_tokens < 0:
            raise ValueError("Output token count cannot be negative")


class ResumeParsingService(ABC):
    @abstractmethod
    async def parse(self, text: str) -> ResumeParsingResult:
        """Convert extracted resume text into structured resume data."""
