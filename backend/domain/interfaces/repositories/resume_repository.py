from abc import ABC, abstractmethod

from domain.entities.resume import Resume, ResumeVersion


class ResumeRepository(ABC):
    @abstractmethod
    async def create(self, resume: Resume) -> Resume:
        """Persist a new resume aggregate."""

    @abstractmethod
    async def get_by_id(self, resume_id: str, user_id: str) -> Resume | None:
        """Return a resume only when it belongs to the supplied user."""

    @abstractmethod
    async def list_by_user(self, user_id: str) -> list[Resume]:
        """Return all resumes owned by a user, newest first."""

    @abstractmethod
    async def update(self, resume: Resume) -> Resume | None:
        """Persist mutable state for an existing resume aggregate."""

    @abstractmethod
    async def delete(self, resume_id: str, user_id: str) -> Resume | None:
        """Delete and return an owned resume, or return None when unavailable."""

    @abstractmethod
    async def create_version(
        self,
        version: ResumeVersion,
        user_id: str,
    ) -> ResumeVersion:
        """Persist a version under a resume owned by the supplied user."""

    @abstractmethod
    async def get_version(
        self,
        resume_id: str,
        version_id: str,
        user_id: str,
    ) -> ResumeVersion | None:
        """Return an owned resume version by ID."""

    @abstractmethod
    async def list_versions(
        self,
        resume_id: str,
        user_id: str,
    ) -> list[ResumeVersion]:
        """Return versions for an owned resume, newest version first."""
