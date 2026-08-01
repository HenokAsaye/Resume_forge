import logging
from collections.abc import Awaitable, Callable
from typing import TypeVar

from domain.entities.resume import Resume, ResumeVersion
from domain.exceptions import (
    ResumeNotFoundError,
    ResumeRepositoryError,
    ResumeVersionConflictError,
)
from domain.interfaces.repositories.resume_repository import ResumeRepository
from infrastructure.database.mappers.resume_mapper import ResumeMapper
from postgrest.exceptions import APIError

from supabase import AsyncClient

ResultT = TypeVar("ResultT")
logger = logging.getLogger(__name__)


class SupabaseResumeRepository(ResumeRepository):
    def __init__(self, client: AsyncClient):
        self._client = client

    async def create(self, resume: Resume) -> Resume:
        result = await self._execute(
            lambda: (
                self._client.table("resumes")
                .insert(ResumeMapper.to_record(resume))
                .execute()
            )
        )
        return ResumeMapper.from_record(result.data[0]) if result.data else resume

    async def get_by_id(self, resume_id: str, user_id: str) -> Resume | None:
        result = await self._execute(
            lambda: (
                self._client.table("resumes")
                .select("*")
                .eq("id", resume_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
        )
        return ResumeMapper.from_record(result.data[0]) if result.data else None

    async def list_by_user(self, user_id: str) -> list[Resume]:
        result = await self._execute(
            lambda: (
                self._client.table("resumes")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
        )
        return [ResumeMapper.from_record(record) for record in result.data]

    async def update(self, resume: Resume) -> Resume | None:
        result = await self._execute(
            lambda: (
                self._client.table("resumes")
                .update(ResumeMapper.to_update_record(resume))
                .eq("id", resume.id)
                .eq("user_id", resume.user_id)
                .execute()
            )
        )
        return ResumeMapper.from_record(result.data[0]) if result.data else None

    async def delete(self, resume_id: str, user_id: str) -> Resume | None:
        resume = await self.get_by_id(resume_id, user_id)
        if resume is None:
            return None

        result = await self._execute(
            lambda: (
                self._client.table("resumes")
                .delete()
                .eq("id", resume_id)
                .eq("user_id", user_id)
                .execute()
            )
        )
        return resume if result.data else None

    async def create_version(
        self,
        version: ResumeVersion,
        user_id: str,
    ) -> ResumeVersion:
        if await self.get_by_id(version.resume_id, user_id) is None:
            raise ResumeNotFoundError("Resume not found")

        result = await self._execute(
            lambda: (
                self._client.table("resume_versions")
                .insert(ResumeMapper.version_to_record(version))
                .execute()
            ),
            version_conflict=True,
        )

        return (
            ResumeMapper.version_from_record(result.data[0]) if result.data else version
        )

    async def get_version(
        self,
        resume_id: str,
        version_id: str,
        user_id: str,
    ) -> ResumeVersion | None:
        if await self.get_by_id(resume_id, user_id) is None:
            return None

        result = await self._execute(
            lambda: (
                self._client.table("resume_versions")
                .select("*")
                .eq("id", version_id)
                .eq("resume_id", resume_id)
                .limit(1)
                .execute()
            )
        )
        return ResumeMapper.version_from_record(result.data[0]) if result.data else None

    async def list_versions(
        self,
        resume_id: str,
        user_id: str,
    ) -> list[ResumeVersion]:
        if await self.get_by_id(resume_id, user_id) is None:
            return []

        result = await self._execute(
            lambda: (
                self._client.table("resume_versions")
                .select("*")
                .eq("resume_id", resume_id)
                .order("version_number", desc=True)
                .execute()
            )
        )
        return [ResumeMapper.version_from_record(record) for record in result.data]

    async def _execute(
        self,
        operation: Callable[[], Awaitable[ResultT]],
        *,
        version_conflict: bool = False,
    ) -> ResultT:
        try:
            return await operation()
        except APIError as exc:
            if version_conflict and exc.code == "23505":
                raise ResumeVersionConflictError(
                    "Resume version number already exists"
                ) from exc
            logger.exception(
                "Supabase resume persistence failed: code=%s message=%s "
                "details=%s hint=%s",
                exc.code,
                exc.message,
                exc.details,
                exc.hint,
            )
            raise ResumeRepositoryError("Resume persistence operation failed") from exc
