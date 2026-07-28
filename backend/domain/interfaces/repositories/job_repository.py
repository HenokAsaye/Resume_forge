from abc import ABC, abstractmethod

from domain.entities.job_description import JobDescription


class JobRepository(ABC):
    @abstractmethod
    async def create(self, job: JobDescription) -> JobDescription:
        """Persist a job description."""

    @abstractmethod
    async def get_by_id(self, job_id: str, user_id: str) -> JobDescription | None:
        """Return an owned job description."""

    @abstractmethod
    async def list_by_user(self, user_id: str) -> list[JobDescription]:
        """Return a user's jobs newest first."""

    @abstractmethod
    async def update(self, job: JobDescription) -> JobDescription | None:
        """Persist job parsing changes."""

    @abstractmethod
    async def delete(self, job_id: str, user_id: str) -> JobDescription | None:
        """Delete and return an owned job."""
