from typing import Optional

from supabase import Client

from domain.entities.resume import Resume, ResumeVersion
from domain.interfaces.repositories.resume_repository import ResumeRepository


class SupabaseResumeRepository(ResumeRepository):
    def __init__(self, client: Client):
        self._client = client

    async def create(self, resume: Resume) -> Resume:
        self._client.table("resumes").insert({
            "id": resume.id,
            "user_id": resume.user_id,
            "name": resume.name,
            "original_file_url": resume.original_file_url,
            "created_at": resume.created_at.isoformat(),
        }).execute()
        return resume

    async def get_by_id(self, resume_id: str) -> Optional[Resume]:
        result = self._client.table("resumes").select("*").eq("id", resume_id).execute()
        if not result.data:
            return None
        return Resume(**result.data[0])

    async def list_by_user(self, user_id: str) -> list[Resume]:
        result = (
            self._client.table("resumes")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return [Resume(**row) for row in result.data]

    async def create_version(self, version: ResumeVersion) -> ResumeVersion:
        self._client.table("resume_versions").insert({
            "id": version.id,
            "resume_id": version.resume_id,
            "version_number": version.version_number,
            "optimized_json": version.optimized_json,
            "diff_json": version.diff_json,
            "created_at": version.created_at.isoformat(),
        }).execute()
        return version

    async def get_versions(self, resume_id: str) -> list[ResumeVersion]:
        result = (
            self._client.table("resume_versions")
            .select("*")
            .eq("resume_id", resume_id)
            .order("version_number", desc=True)
            .execute()
        )
        return [ResumeVersion(**row) for row in result.data]
