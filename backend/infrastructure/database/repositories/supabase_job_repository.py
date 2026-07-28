from postgrest.exceptions import APIError
from supabase import AsyncClient

from domain.entities.job_description import JobDescription
from domain.exceptions import CareerRepositoryError
from domain.interfaces.repositories.job_repository import JobRepository
from infrastructure.database.mappers.career_mapper import CareerMapper


class SupabaseJobRepository(JobRepository):
    def __init__(self, client: AsyncClient):
        self._client = client

    async def create(self, job: JobDescription) -> JobDescription:
        try:
            result = await (
                self._client.table("jobs")
                .insert(CareerMapper.job_to_record(job))
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to create job") from exc
        return CareerMapper.job_from_record(result.data[0]) if result.data else job

    async def get_by_id(
        self,
        job_id: str,
        user_id: str,
    ) -> JobDescription | None:
        try:
            result = await (
                self._client.table("jobs")
                .select("*")
                .eq("id", job_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to read job") from exc
        return CareerMapper.job_from_record(result.data[0]) if result.data else None

    async def list_by_user(self, user_id: str) -> list[JobDescription]:
        try:
            result = await (
                self._client.table("jobs")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to list jobs") from exc
        return [CareerMapper.job_from_record(record) for record in result.data]

    async def update(self, job: JobDescription) -> JobDescription | None:
        try:
            result = await (
                self._client.table("jobs")
                .update(
                    {
                        "title": job.title,
                        "company": job.company,
                        "raw_text": job.raw_text,
                        "url": job.url,
                        "parsed_json": job.parsed_json,
                        "updated_at": job.updated_at.isoformat(),
                    }
                )
                .eq("id", job.id)
                .eq("user_id", job.user_id)
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to update job") from exc
        return CareerMapper.job_from_record(result.data[0]) if result.data else None

    async def delete(
        self,
        job_id: str,
        user_id: str,
    ) -> JobDescription | None:
        job = await self.get_by_id(job_id, user_id)
        if job is None:
            return None
        try:
            result = await (
                self._client.table("jobs")
                .delete()
                .eq("id", job_id)
                .eq("user_id", user_id)
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to delete job") from exc
        return job if result.data else None
