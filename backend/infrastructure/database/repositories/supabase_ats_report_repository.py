from postgrest.exceptions import APIError
from supabase import AsyncClient

from domain.entities.ats_report import ATSReport
from domain.exceptions import CareerRepositoryError
from domain.interfaces.repositories.ats_report_repository import (
    ATSReportRepository,
)
from infrastructure.database.mappers.career_mapper import CareerMapper


class SupabaseATSReportRepository(ATSReportRepository):
    def __init__(self, client: AsyncClient):
        self._client = client

    async def create(self, report: ATSReport) -> ATSReport:
        try:
            result = await (
                self._client.table("ats_reports")
                .insert(CareerMapper.ats_to_record(report))
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to create ATS report") from exc
        return CareerMapper.ats_from_record(result.data[0]) if result.data else report

    async def get_by_id(
        self,
        report_id: str,
        user_id: str,
    ) -> ATSReport | None:
        try:
            result = await (
                self._client.table("ats_reports")
                .select("*")
                .eq("id", report_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
        except APIError as exc:
            raise CareerRepositoryError("Unable to read ATS report") from exc
        return CareerMapper.ats_from_record(result.data[0]) if result.data else None

    async def list_by_user(
        self,
        user_id: str,
        resume_id: str | None = None,
        job_id: str | None = None,
    ) -> list[ATSReport]:
        query = self._client.table("ats_reports").select("*").eq("user_id", user_id)
        if resume_id:
            query = query.eq("resume_id", resume_id)
        if job_id:
            query = query.eq("job_id", job_id)
        try:
            result = await query.order("created_at", desc=True).execute()
        except APIError as exc:
            raise CareerRepositoryError("Unable to list ATS reports") from exc
        return [CareerMapper.ats_from_record(record) for record in result.data]
