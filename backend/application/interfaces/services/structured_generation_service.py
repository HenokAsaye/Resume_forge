from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Generic, TypeVar

from pydantic import BaseModel

OutputT = TypeVar("OutputT", bound=BaseModel)


@dataclass(frozen=True, slots=True)
class AIResult(Generic[OutputT]):
    output: OutputT
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


class StructuredGenerationService(ABC):
    @abstractmethod
    async def generate(
        self,
        *,
        instructions: str,
        input_text: str,
        output_type: type[OutputT],
    ) -> AIResult[OutputT]:
        """Generate provider-neutral, schema-validated output."""
