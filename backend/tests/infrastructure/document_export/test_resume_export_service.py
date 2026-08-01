import asyncio
import io

import pymupdf
import pytest
from application.dto.resume_schema import ResumeDocument
from application.interfaces.services.resume_export_service import (
    ResumeExportFormat,
)
from docx import Document
from infrastructure.document_export.resume_export_service import (
    ResumeDocumentExportService,
)


@pytest.fixture(autouse=True)
def run_thread_work_inline(monkeypatch: pytest.MonkeyPatch) -> None:
    async def run_inline(function, /, *args, **kwargs):
        return function(*args, **kwargs)

    monkeypatch.setattr(asyncio, "to_thread", run_inline)


def make_resume() -> ResumeDocument:
    return ResumeDocument.model_validate(
        {
            "contact": {
                "name": "Henok Asaye",
                "email": "henok@example.com",
                "phone": "+251900000000",
                "location": "Addis Ababa",
                "links": ["https://github.com/henok"],
            },
            "summary": "Backend engineer focused on reliable APIs.",
            "skills": ["Python", "FastAPI"],
            "experience": [
                {
                    "title": "Backend Engineer",
                    "company": "Acme",
                    "start": "2022",
                    "end": "Present",
                    "bullets": ["Built REST APIs."],
                }
            ],
            "education": [],
            "projects": [],
            "certifications": [],
        }
    )


@pytest.mark.asyncio
async def test_exports_docx_with_resume_content() -> None:
    service = ResumeDocumentExportService()

    exported = await service.export(
        make_resume(),
        ResumeExportFormat.DOCX,
        "Henok Backend Resume",
    )

    document = Document(io.BytesIO(exported.content))
    text = "\n".join(paragraph.text for paragraph in document.paragraphs)

    assert exported.filename == "Henok_Backend_Resume.docx"
    assert exported.media_type.endswith("wordprocessingml.document")
    assert "Henok Asaye" in text
    assert "Built REST APIs." in text


@pytest.mark.asyncio
async def test_exports_readable_pdf() -> None:
    service = ResumeDocumentExportService()

    exported = await service.export(
        make_resume(),
        ResumeExportFormat.PDF,
        "optimized resume",
    )

    with pymupdf.open(stream=exported.content, filetype="pdf") as document:
        text = "\n".join(page.get_text() for page in document)

    assert exported.filename == "optimized_resume.pdf"
    assert exported.media_type == "application/pdf"
    assert "Henok Asaye" in text
    assert "Backend Engineer" in text
