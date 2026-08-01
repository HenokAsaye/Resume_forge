from domain.entities.cover_letter import CoverLetter
from domain.exceptions import CareerRepositoryError
from domain.interfaces.repositories.cover_letter_repository import (
    CoverLetterRepository,
)
from infrastructure.database.mappers.career_mapper import CareerMapper
from postgrest.exceptions import APIError

from supabase import AsyncClient


class SupabaseCoverLetterRepository(CoverLetterRepository):
    def __init__(self, client: AsyncClient):
        self._client = client

    async def create(self, cover_letter: CoverLetter) -> CoverLetter:
        try:
            result = await (
                self._client.table("cover_letters")
                .insert(CareerMapper.cover_letter_to_record(cover_letter))
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to create cover letter") from exc
        return (
            CareerMapper.cover_letter_from_record(result.data[0])
            if result.data
            else cover_letter
        )

    async def get_by_id(
        self,
        cover_letter_id: str,
        user_id: str,
    ) -> CoverLetter | None:
        try:
            result = await (
                self._client.table("cover_letters")
                .select("*")
                .eq("id", cover_letter_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to read cover letter") from exc
        return (
            CareerMapper.cover_letter_from_record(result.data[0])
            if result.data
            else None
        )

    async def list_by_user(
        self,
        user_id: str,
        resume_id: str | None = None,
        job_id: str | None = None,
    ) -> list[CoverLetter]:
        query = self._client.table("cover_letters").select("*").eq("user_id", user_id)
        if resume_id:
            query = query.eq("resume_id", resume_id)
        if job_id:
            query = query.eq("job_id", job_id)
        try:
            result = await query.order("created_at", desc=True).execute()
        except APIError as exc:
            raise CareerRepositoryError("Unable to list cover letters") from exc
        return [CareerMapper.cover_letter_from_record(record) for record in result.data]

    async def update(self, cover_letter: CoverLetter) -> CoverLetter | None:
        try:
            result = await (
                self._client.table("cover_letters")
                .update(
                    {
                        "content": cover_letter.content,
                        "updated_at": cover_letter.updated_at.isoformat(),
                    }
                )
                .eq("id", cover_letter.id)
                .eq("user_id", cover_letter.user_id)
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to update cover letter") from exc
        return (
            CareerMapper.cover_letter_from_record(result.data[0])
            if result.data
            else None
        )

    async def delete(
        self,
        cover_letter_id: str,
        user_id: str,
    ) -> CoverLetter | None:
        cover_letter = await self.get_by_id(cover_letter_id, user_id)
        if cover_letter is None:
            return None
        try:
            result = await (
                self._client.table("cover_letters")
                .delete()
                .eq("id", cover_letter_id)
                .eq("user_id", user_id)
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to delete cover letter") from exc
        return cover_letter if result.data else None
