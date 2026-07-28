from application.interfaces.services.document_text_extraction_service import (
    DocumentTextExtractionService,
)
from application.interfaces.services.file_storage_service import FileStorageService
from application.interfaces.services.resume_parsing_service import ResumeParsingService
from domain.entities.resume import Resume
from domain.exceptions import ResumeNotFoundError, ResumeRepositoryError
from domain.interfaces.repositories.resume_repository import ResumeRepository


class ParseResumeUseCase:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        storage: FileStorageService,
        extractor: DocumentTextExtractionService,
        parser: ResumeParsingService,
    ):
        self._resume_repo = resume_repo
        self._storage = storage
        self._extractor = extractor
        self._parser = parser

    async def execute(self, resume_id: str, user_id: str) -> Resume:
        resume = await self._resume_repo.get_by_id(resume_id, user_id)
        if resume is None:
            raise ResumeNotFoundError("Resume not found")
        if resume.parsed:
            return resume

        resume.mark_processing()
        await self._require_update(resume)

        try:
            content = await self._storage.download(
                resume.storage_bucket,
                resume.storage_path,
            )
            extracted = await self._extractor.extract(content, resume.mime_type)
            parsed = await self._parser.parse(extracted.text)
            resume.mark_parsed(parsed.resume.model_dump(mode="json"))
            return await self._require_update(resume)
        except Exception as exc:
            if resume.status.value == "processing":
                resume.mark_failed(str(exc) or exc.__class__.__name__)
                try:
                    await self._require_update(resume)
                except ResumeRepositoryError as update_error:
                    exc.add_note(f"Failed to persist parsing failure: {update_error}")
            raise

    async def _require_update(self, resume: Resume) -> Resume:
        updated = await self._resume_repo.update(resume)
        if updated is None:
            raise ResumeNotFoundError("Resume not found")
        return updated
