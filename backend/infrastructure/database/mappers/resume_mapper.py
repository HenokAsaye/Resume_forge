from collections.abc import Mapping
from datetime import datetime
from typing import Any

from domain.entities.resume import Resume, ResumeVersion


class ResumeMapper:
    @staticmethod
    def to_record(resume: Resume) -> dict[str, object]:
        return {
            "id": resume.id,
            "user_id": resume.user_id,
            "name": resume.name,
            "storage_bucket": resume.storage_bucket,
            "storage_path": resume.storage_path,
            "original_filename": resume.original_filename,
            "mime_type": resume.mime_type.value,
            "size_bytes": resume.size_bytes,
            "sha256": resume.sha256,
            "status": resume.status.value,
            "parsed_json": resume.parsed_json,
            "parse_error": resume.parse_error,
            "created_at": resume.created_at.isoformat(),
            "updated_at": resume.updated_at.isoformat(),
        }

    @staticmethod
    def to_update_record(resume: Resume) -> dict[str, object]:
        return {
            "name": resume.name,
            "status": resume.status.value,
            "parsed_json": resume.parsed_json,
            "parse_error": resume.parse_error,
            "updated_at": resume.updated_at.isoformat(),
        }

    @staticmethod
    def from_record(record: Mapping[str, Any]) -> Resume:
        return Resume(
            id=str(record["id"]),
            user_id=str(record["user_id"]),
            name=str(record["name"]),
            storage_bucket=str(record["storage_bucket"]),
            storage_path=str(record["storage_path"]),
            original_filename=str(record["original_filename"]),
            mime_type=str(record["mime_type"]),
            size_bytes=int(record["size_bytes"]),
            sha256=str(record["sha256"]),
            status=str(record["status"]),
            parsed_json=record.get("parsed_json"),
            parse_error=record.get("parse_error"),
            created_at=ResumeMapper._parse_datetime(record["created_at"]),
            updated_at=ResumeMapper._parse_datetime(record["updated_at"]),
        )

    @staticmethod
    def version_to_record(version: ResumeVersion) -> dict[str, object]:
        return {
            "id": version.id,
            "resume_id": version.resume_id,
            "version_number": version.version_number,
            "optimized_json": version.optimized_json,
            "source_job_id": version.source_job_id,
            "diff_json": version.diff_json,
            "created_at": version.created_at.isoformat(),
        }

    @staticmethod
    def version_from_record(record: Mapping[str, Any]) -> ResumeVersion:
        return ResumeVersion(
            id=str(record["id"]),
            resume_id=str(record["resume_id"]),
            version_number=int(record["version_number"]),
            optimized_json=record["optimized_json"],
            source_job_id=record.get("source_job_id"),
            diff_json=record.get("diff_json"),
            created_at=ResumeMapper._parse_datetime(record["created_at"]),
        )

    @staticmethod
    def _parse_datetime(value: object) -> datetime:
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        raise TypeError("Database timestamp must be a datetime or ISO 8601 string")
