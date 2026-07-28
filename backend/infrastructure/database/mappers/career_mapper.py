from collections.abc import Mapping
from datetime import datetime
from typing import Any

from domain.entities.ats_report import ATSReport
from domain.entities.cover_letter import CoverLetter
from domain.entities.job_description import JobDescription


def parse_datetime(value: object) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    raise TypeError("Database timestamp must be a datetime or ISO 8601 string")


class CareerMapper:
    @staticmethod
    def job_to_record(job: JobDescription) -> dict[str, object]:
        return {
            "id": job.id,
            "user_id": job.user_id,
            "title": job.title,
            "company": job.company,
            "raw_text": job.raw_text,
            "url": job.url,
            "parsed_json": job.parsed_json,
            "created_at": job.created_at.isoformat(),
            "updated_at": job.updated_at.isoformat(),
        }

    @staticmethod
    def job_from_record(record: Mapping[str, Any]) -> JobDescription:
        return JobDescription(
            id=str(record["id"]),
            user_id=str(record["user_id"]),
            title=str(record["title"]),
            company=str(record.get("company") or ""),
            raw_text=str(record["raw_text"]),
            url=record.get("url"),
            parsed_json=record.get("parsed_json"),
            created_at=parse_datetime(record["created_at"]),
            updated_at=parse_datetime(record["updated_at"]),
        )

    @staticmethod
    def ats_to_record(report: ATSReport) -> dict[str, object]:
        return {
            "id": report.id,
            "user_id": report.user_id,
            "resume_id": report.resume_id,
            "job_id": report.job_id,
            "resume_version_id": report.resume_version_id,
            "analysis_stage": report.analysis_stage.value,
            "match_score": report.match_score,
            "missing_keywords": report.missing_keywords,
            "suggestions": report.suggestions,
            "strengths": report.strengths,
            "weaknesses": report.weaknesses,
            "created_at": report.created_at.isoformat(),
        }

    @staticmethod
    def ats_from_record(record: Mapping[str, Any]) -> ATSReport:
        return ATSReport(
            id=str(record["id"]),
            user_id=str(record["user_id"]),
            resume_id=str(record["resume_id"]),
            job_id=str(record["job_id"]),
            resume_version_id=(
                str(record["resume_version_id"])
                if record.get("resume_version_id")
                else None
            ),
            analysis_stage=str(record["analysis_stage"]),
            match_score=float(record["match_score"]),
            missing_keywords=list(record.get("missing_keywords") or []),
            suggestions=list(record.get("suggestions") or []),
            strengths=list(record.get("strengths") or []),
            weaknesses=list(record.get("weaknesses") or []),
            created_at=parse_datetime(record["created_at"]),
        )

    @staticmethod
    def cover_letter_to_record(letter: CoverLetter) -> dict[str, object]:
        return {
            "id": letter.id,
            "user_id": letter.user_id,
            "resume_id": letter.resume_id,
            "job_id": letter.job_id,
            "resume_version_id": letter.resume_version_id,
            "content": letter.content,
            "created_at": letter.created_at.isoformat(),
            "updated_at": letter.updated_at.isoformat(),
        }

    @staticmethod
    def cover_letter_from_record(record: Mapping[str, Any]) -> CoverLetter:
        return CoverLetter(
            id=str(record["id"]),
            user_id=str(record["user_id"]),
            resume_id=str(record["resume_id"]),
            job_id=str(record["job_id"]),
            resume_version_id=(
                str(record["resume_version_id"])
                if record.get("resume_version_id")
                else None
            ),
            content=str(record["content"]),
            created_at=parse_datetime(record["created_at"]),
            updated_at=parse_datetime(record["updated_at"]),
        )
