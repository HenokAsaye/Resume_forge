from application.dto.resume_schema import ResumeDocument
from application.interfaces.services.resume_export_service import (
    ExportedResume,
    ResumeExportFormat,
    ResumeExportService,
)
from domain.exceptions import (
    ResumeNotFoundError,
    ResumeNotParsedError,
    ResumeVersionNotFoundError,
)
from domain.interfaces.repositories.resume_repository import ResumeRepository


class ExportResumeUseCase:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        exporter: ResumeExportService,
    ):
        self._resume_repo = resume_repo
        self._exporter = exporter

    async def execute(
        self,
        resume_id: str,
        user_id: str,
        export_format: ResumeExportFormat,
        version_number: int | None = None,
    ) -> ExportedResume:
        resume = await self._resume_repo.get_by_id(resume_id, user_id)
        if resume is None:
            raise ResumeNotFoundError("Resume not found")

        versions = await self._resume_repo.list_versions(resume_id, user_id)
        if version_number is not None:
            version = next(
                (
                    candidate
                    for candidate in versions
                    if candidate.version_number == version_number
                ),
                None,
            )
            if version is None:
                raise ResumeVersionNotFoundError("Resume version not found")
            document_data = version.optimized_json
            filename = f"{resume.name}-v{version.version_number}"
        elif versions:
            version = versions[0]
            document_data = version.optimized_json
            filename = f"{resume.name}-v{version.version_number}"
        else:
            if resume.parsed_json is None:
                raise ResumeNotParsedError("Resume must be parsed before export")
            document_data = resume.parsed_json
            filename = resume.name

        document = ResumeDocument.model_validate(document_data)
        return await self._exporter.export(document, export_format, filename)
