from abc import ABC, abstractmethod

from domain.entities.ats_report import ATSReport


class ATSReportRepository(ABC):
    @abstractmethod
    async def create(self, report: ATSReport) -> ATSReport:
        """Persist an ATS analysis report."""

    @abstractmethod
    async def get_by_id(self, report_id: str, user_id: str) -> ATSReport | None:
        """Return an owned ATS report."""

    @abstractmethod
    async def list_by_user(
        self,
        user_id: str,
        resume_id: str | None = None,
        job_id: str | None = None,
    ) -> list[ATSReport]:
        """Return owned reports with optional filters."""
