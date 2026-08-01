import hashlib
import io
import zipfile

import pymupdf
import pytest
from application.exceptions import (
    EmptyFileError,
    FileTooLargeError,
    InvalidFileContentError,
    UnsupportedFileTypeError,
)
from application.interfaces.services.file_validation_service import (
    FileValidationPolicy,
)
from domain.entities.resume import ResumeMimeType
from infrastructure.file_validation.resume_file_validator import (
    ResumeFileValidationService,
)


def make_policy(
    *,
    max_size_bytes: int = 1024 * 1024,
    max_uncompressed_size_bytes: int = 5 * 1024 * 1024,
) -> FileValidationPolicy:
    return FileValidationPolicy(
        max_size_bytes=max_size_bytes,
        max_uncompressed_size_bytes=max_uncompressed_size_bytes,
        allowed_extensions=frozenset({".pdf", ".docx"}),
        allowed_mime_types=frozenset(
            {
                ResumeMimeType.PDF,
                ResumeMimeType.DOCX,
            }
        ),
    )


def make_pdf() -> bytes:
    document = pymupdf.open()
    document.new_page()
    content = document.tobytes()
    document.close()
    return content


def make_docx(*, document_size: int = 10) -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(
        output,
        mode="w",
        compression=zipfile.ZIP_DEFLATED,
    ) as archive:
        archive.writestr("[Content_Types].xml", "<Types />")
        archive.writestr("_rels/.rels", "<Relationships />")
        archive.writestr("word/document.xml", "x" * document_size)
    return output.getvalue()


@pytest.mark.asyncio
async def test_valid_pdf_returns_normalized_metadata_and_hash() -> None:
    content = make_pdf()
    validator = ResumeFileValidationService(make_policy())

    validated = await validator.validate(
        r"C:\fakepath\Backend Resume.PDF",
        "application/pdf",
        content,
    )

    assert validated.original_filename == "Backend Resume.PDF"
    assert validated.extension == ".pdf"
    assert validated.mime_type is ResumeMimeType.PDF
    assert validated.size_bytes == len(content)
    assert validated.sha256 == hashlib.sha256(content).hexdigest()
    assert validated.content == content


@pytest.mark.asyncio
async def test_valid_docx_is_accepted() -> None:
    content = make_docx()
    validator = ResumeFileValidationService(make_policy())

    validated = await validator.validate(
        "resume.docx",
        ResumeMimeType.DOCX.value,
        content,
    )

    assert validated.mime_type is ResumeMimeType.DOCX
    assert validated.extension == ".docx"


@pytest.mark.asyncio
async def test_empty_file_is_rejected() -> None:
    validator = ResumeFileValidationService(make_policy())

    with pytest.raises(EmptyFileError):
        await validator.validate("resume.pdf", "application/pdf", b"")


@pytest.mark.asyncio
async def test_file_larger_than_configured_limit_is_rejected() -> None:
    validator = ResumeFileValidationService(
        make_policy(max_size_bytes=4, max_uncompressed_size_bytes=8)
    )

    with pytest.raises(FileTooLargeError):
        await validator.validate(
            "resume.pdf",
            "application/pdf",
            b"%PDF-large",
        )


@pytest.mark.asyncio
async def test_extension_and_declared_mime_type_must_match() -> None:
    validator = ResumeFileValidationService(make_policy())

    with pytest.raises(UnsupportedFileTypeError):
        await validator.validate(
            "resume.pdf",
            ResumeMimeType.DOCX.value,
            make_pdf(),
        )


@pytest.mark.asyncio
async def test_corrupt_pdf_is_rejected() -> None:
    validator = ResumeFileValidationService(make_policy())

    with pytest.raises(InvalidFileContentError):
        await validator.validate(
            "resume.pdf",
            "application/pdf",
            b"%PDF-not-a-real-document",
        )


@pytest.mark.asyncio
async def test_docx_uncompressed_size_limit_is_configurable() -> None:
    validator = ResumeFileValidationService(
        make_policy(
            max_size_bytes=1024,
            max_uncompressed_size_bytes=1100,
        )
    )

    with pytest.raises(FileTooLargeError):
        await validator.validate(
            "resume.docx",
            ResumeMimeType.DOCX.value,
            make_docx(document_size=2000),
        )
