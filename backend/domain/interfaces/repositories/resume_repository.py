from abc import ABC, abstractmethod

from domain.entities.resume import Resume, ResumeVersion


class ResumeRepository(ABC):
    @abstractmethod
    async def create(self, resume: Resume) -> Resume:
        pass

    @abstractmethod
    async def get_by_id(self, resume_id: str) -> Resume | None:
        pass

    @abstractmethod
    async def list_by_user(self, user_id: str) -> list[Resume]:
        pass

    @abstractmethod
    async def create_version(self, version: ResumeVersion) -> ResumeVersion:
        pass

    @abstractmethod
    async def get_versions(self, resume_id: str) -> list[ResumeVersion]:
        pass
