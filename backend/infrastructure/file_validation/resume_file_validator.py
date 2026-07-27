import hashlib
import io
import zipfile
from pathlib import Path

import pymupdf

from application.exceptions import (
    EmptyFileError,
    FileTooLargeError,
    InvalidFileContentError,
    UnsupportedFileTypeError,
)
from application.interfaces.services.file_validation_service import (
    FileValidationPolicy,
    FileValidationService,
    ValidatedFile,
)
from domain.entities.resume import ResumeMimeType

MIME_TYPE_BY_EXTENSION = {
    ".pdf": ResumeMimeType.PDF,
    ".docx": ResumeMimeType.DOCX,
}

REQUIRED_DOCX_ENTRIES = frozenset(
    {
        "[Content_Types].xml",
        "_rels/.rels",
        "word/document.xml",
    }
)


class ResumeFileValidationService(FileValidationService):
    def __init__(self, policy: FileValidationPolicy):
        self._policy = policy

    async def validate(
        self,
        filename: str,
        declared_content_type: str | None,
        content: bytes,
    ) -> ValidatedFile:
        normalized_filename = self._normalize_filename(filename)
        extension = Path(normalized_filename).suffix.lower()
        expected_mime_type = self._validate_declared_type(
            extension,
            declared_content_type,
        )
        self._validate_size(content)
        self._validate_content(expected_mime_type, content)

        return ValidatedFile(
            original_filename=normalized_filename,
            extension=extension,
            mime_type=expected_mime_type,
            size_bytes=len(content),
            sha256=hashlib.sha256(content).hexdigest(),
            content=content,
        )

    def _normalize_filename(self, filename: str) -> str:
        normalized = filename.replace("\\", "/").rsplit("/", maxsplit=1)[-1].strip()
        if not normalized:
            raise InvalidFileContentError("A valid filename is required")
        if len(normalized) > 255:
            raise InvalidFileContentError(
                "Filename cannot contain more than 255 characters"
            )
        return normalized

    def _validate_declared_type(
        self,
        extension: str,
        declared_content_type: str | None,
    ) -> ResumeMimeType:
        if extension not in self._policy.allowed_extensions:
            raise UnsupportedFileTypeError(
                f"File extension '{extension or '(none)'}' is not allowed"
            )

        expected_mime_type = MIME_TYPE_BY_EXTENSION.get(extension)
        if (
            expected_mime_type is None
            or expected_mime_type not in self._policy.allowed_mime_types
        ):
            raise UnsupportedFileTypeError(
                f"No supported MIME type is configured for '{extension}'"
            )

        normalized_declared_type = (
            declared_content_type.split(";", maxsplit=1)[0].strip().lower()
            if declared_content_type
            else ""
        )
        if normalized_declared_type != expected_mime_type.value:
            raise UnsupportedFileTypeError(
                "Declared MIME type does not match the file extension"
            )

        return expected_mime_type

    def _validate_size(self, content: bytes) -> None:
        if not content:
            raise EmptyFileError("Resume file cannot be empty")
        if len(content) > self._policy.max_size_bytes:
            raise FileTooLargeError(
                f"Resume file exceeds the {self._policy.max_size_bytes}-byte limit"
            )

    def _validate_content(
        self,
        mime_type: ResumeMimeType,
        content: bytes,
    ) -> None:
        if mime_type is ResumeMimeType.PDF:
            self._validate_pdf(content)
            return
        if mime_type is ResumeMimeType.DOCX:
            self._validate_docx(content)
            return
        raise UnsupportedFileTypeError("No validator exists for this MIME type")

    @staticmethod
    def _validate_pdf(content: bytes) -> None:
        if not content.startswith(b"%PDF-"):
            raise InvalidFileContentError("File content is not a valid PDF")

        try:
            with pymupdf.open(stream=content, filetype="pdf") as document:
                if document.needs_pass:
                    raise InvalidFileContentError(
                        "Password-protected PDF files are not supported"
                    )
                if document.page_count < 1:
                    raise InvalidFileContentError("PDF must contain at least one page")
        except InvalidFileContentError:
            raise
        except Exception as exc:
            raise InvalidFileContentError("File content is not a readable PDF") from exc

    def _validate_docx(self, content: bytes) -> None:
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                entries = set(archive.namelist())
                if not REQUIRED_DOCX_ENTRIES.issubset(entries):
                    raise InvalidFileContentError(
                        "DOCX file is missing required document entries"
                    )
                uncompressed_size = sum(entry.file_size for entry in archive.infolist())
                if uncompressed_size > self._policy.max_uncompressed_size_bytes:
                    raise FileTooLargeError(
                        "Uncompressed DOCX content exceeds the configured limit"
                    )
                if archive.testzip() is not None:
                    raise InvalidFileContentError(
                        "DOCX file contains a corrupt archive entry"
                    )
        except (InvalidFileContentError, FileTooLargeError):
            raise
        except (OSError, zipfile.BadZipFile) as exc:
            raise InvalidFileContentError(
                "File content is not a readable DOCX document"
            ) from exc
