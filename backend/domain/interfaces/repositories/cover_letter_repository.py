from abc import ABC, abstractmethod

from domain.entities.cover_letter import CoverLetter


class CoverLetterRepository(ABC):
    @abstractmethod
    async def create(self, cover_letter: CoverLetter) -> CoverLetter:
        """Persist a generated cover letter."""

    @abstractmethod
    async def get_by_id(
        self,
        cover_letter_id: str,
        user_id: str,
    ) -> CoverLetter | None:
        """Return an owned cover letter."""

    @abstractmethod
    async def list_by_user(
        self,
        user_id: str,
        resume_id: str | None = None,
        job_id: str | None = None,
    ) -> list[CoverLetter]:
        """Return owned cover letters with optional filters."""

    @abstractmethod
    async def update(self, cover_letter: CoverLetter) -> CoverLetter | None:
        """Persist edited cover-letter content."""

    @abstractmethod
    async def delete(
        self,
        cover_letter_id: str,
        user_id: str,
    ) -> CoverLetter | None:
        """Delete and return an owned cover letter."""
