from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from application.use_cases.resume import ResumeDownload
from config import Settings, get_settings
from domain.entities.resume import Resume, ResumeMimeType
from domain.exceptions import ResumeNotFoundError
from domain.interfaces.services.auth_service import AuthenticatedUser
from interfaces.api.deps import (
    get_current_user,
    get_delete_resume_use_case,
    get_download_resume_use_case,
    get_list_resumes_use_case,
    get_resume_use_case,
    get_upload_resume_use_case,
)
from main import create_app


def make_resume() -> Resume:
    created_at = datetime(2026, 7, 25, 10, 0, tzinfo=UTC)
    return Resume(
        id="10000000-0000-0000-0000-000000000001",
        user_id="20000000-0000-0000-0000-000000000001",
        name="Backend Resume",
        storage_path=(
            "20000000-0000-0000-0000-000000000001/"
            "10000000-0000-0000-0000-000000000001/source.pdf"
        ),
        original_filename="backend-resume.pdf",
        mime_type=ResumeMimeType.PDF,
        size_bytes=1024,
        sha256="a" * 64,
        created_at=created_at,
        updated_at=created_at,
    )


@pytest.fixture
def resume() -> Resume:
    return make_resume()


@pytest.fixture
def use_cases(resume: Resume) -> dict[str, AsyncMock]:
    upload = AsyncMock()
    upload.execute.return_value = resume

    list_resumes = AsyncMock()
    list_resumes.execute.return_value = [resume]

    get_resume = AsyncMock()
    get_resume.execute.return_value = resume

    download = AsyncMock()
    download.execute.return_value = ResumeDownload(
        filename=resume.original_filename,
        content_type=resume.mime_type,
        content=b"pdf-content",
    )

    delete = AsyncMock()
    delete.execute.return_value = None

    return {
        "upload": upload,
        "list": list_resumes,
        "get": get_resume,
        "download": download,
        "delete": delete,
    }


@pytest_asyncio.fixture
async def client(use_cases: dict[str, AsyncMock]):
    app = create_app()
    current_user = AuthenticatedUser(
        id="20000000-0000-0000-0000-000000000001",
        email="jane@example.com",
        name="Jane Doe",
        created_at=datetime(2026, 7, 25, 9, 0, tzinfo=UTC),
    )

    async def override_current_user() -> AuthenticatedUser:
        return current_user

    async def override_upload():
        return use_cases["upload"]

    async def override_list():
        return use_cases["list"]

    async def override_get():
        return use_cases["get"]

    async def override_download():
        return use_cases["download"]

    async def override_delete():
        return use_cases["delete"]

    async def override_settings() -> Settings:
        return Settings()

    app.dependency_overrides[get_current_user] = override_current_user
    app.dependency_overrides[get_upload_resume_use_case] = override_upload
    app.dependency_overrides[get_list_resumes_use_case] = override_list
    app.dependency_overrides[get_resume_use_case] = override_get
    app.dependency_overrides[get_download_resume_use_case] = override_download
    app.dependency_overrides[get_delete_resume_use_case] = override_delete
    app.dependency_overrides[get_settings] = override_settings

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as http_client:
        yield http_client


@pytest.mark.asyncio
async def test_upload_resume_returns_created_response(
    client: AsyncClient,
    use_cases: dict[str, AsyncMock],
    resume: Resume,
) -> None:
    response = await client.post(
        "/api/v1/resumes",
        data={"name": "Backend Resume"},
        files={
            "file": (
                "backend-resume.pdf",
                b"pdf-content",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 201
    assert response.json() == {
        "id": resume.id,
        "name": "Backend Resume",
        "file_url": f"http://testserver/api/v1/resumes/{resume.id}/download",
    }
    use_cases["upload"].execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_list_resumes_returns_current_users_resumes(
    client: AsyncClient,
    resume: Resume,
) -> None:
    response = await client.get("/api/v1/resumes")

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": resume.id,
            "name": resume.name,
            "created_at": "2026-07-25T10:00:00Z",
            "parsed": False,
        }
    ]


@pytest.mark.asyncio
async def test_get_resume_returns_private_download_url(
    client: AsyncClient,
    resume: Resume,
) -> None:
    response = await client.get(f"/api/v1/resumes/{resume.id}")

    assert response.status_code == 200
    assert response.json()["original_file_url"] == (
        f"http://testserver/api/v1/resumes/{resume.id}/download"
    )


@pytest.mark.asyncio
async def test_download_resume_streams_original_file(
    client: AsyncClient,
    resume: Resume,
) -> None:
    response = await client.get(f"/api/v1/resumes/{resume.id}/download")

    assert response.status_code == 200
    assert response.content == b"pdf-content"
    assert response.headers["content-type"] == "application/pdf"
    assert "backend-resume.pdf" in response.headers["content-disposition"]


@pytest.mark.asyncio
async def test_delete_resume_returns_no_content_and_authenticated_owner(
    client: AsyncClient,
    use_cases: dict[str, AsyncMock],
    resume: Resume,
) -> None:
    response = await client.delete(f"/api/v1/resumes/{resume.id}")

    assert response.status_code == 204
    assert response.content == b""
    use_cases["delete"].execute.assert_awaited_once_with(
        resume.id,
        resume.user_id,
    )


@pytest.mark.asyncio
async def test_missing_resume_returns_standard_error_body(
    client: AsyncClient,
    use_cases: dict[str, AsyncMock],
    resume: Resume,
) -> None:
    use_cases["get"].execute.side_effect = ResumeNotFoundError("Resume not found")

    response = await client.get(f"/api/v1/resumes/{resume.id}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Resume not found"}
