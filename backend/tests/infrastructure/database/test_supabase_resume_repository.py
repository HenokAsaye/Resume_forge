from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import pytest
from postgrest.exceptions import APIError

from domain.entities.resume import (
    Resume,
    ResumeMimeType,
    ResumeStatus,
    ResumeVersion,
)
from domain.exceptions import ResumeNotFoundError, ResumeVersionConflictError
from infrastructure.database.repositories.supabase_resume_repository import (
    SupabaseResumeRepository,
)


@dataclass
class FakeResult:
    data: list[dict[str, Any]]


class FakeQuery:
    def __init__(self, client: "FakeClient", table_name: str):
        self._client = client
        self.table_name = table_name
        self.operations: list[tuple[str, tuple[Any, ...], dict[str, Any]]] = []

    def _record(self, name: str, *args: Any, **kwargs: Any) -> "FakeQuery":
        self.operations.append((name, args, kwargs))
        return self

    def insert(self, record: dict[str, object]) -> "FakeQuery":
        return self._record("insert", record)

    def select(self, columns: str) -> "FakeQuery":
        return self._record("select", columns)

    def update(self, record: dict[str, object]) -> "FakeQuery":
        return self._record("update", record)

    def delete(self) -> "FakeQuery":
        return self._record("delete")

    def eq(self, column: str, value: object) -> "FakeQuery":
        return self._record("eq", column, value)

    def limit(self, count: int) -> "FakeQuery":
        return self._record("limit", count)

    def order(self, column: str, *, desc: bool = False) -> "FakeQuery":
        return self._record("order", column, desc=desc)

    async def execute(self) -> FakeResult:
        response = self._client.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class FakeClient:
    def __init__(self, *responses: FakeResult | Exception):
        self.responses = list(responses)
        self.queries: list[FakeQuery] = []

    def table(self, table_name: str) -> FakeQuery:
        query = FakeQuery(self, table_name)
        self.queries.append(query)
        return query


def make_resume() -> Resume:
    created_at = datetime(2026, 7, 25, 10, 0, tzinfo=UTC)
    return Resume(
        id="10000000-0000-0000-0000-000000000001",
        user_id="20000000-0000-0000-0000-000000000001",
        name="Backend Resume",
        storage_bucket="resumes",
        storage_path=(
            "20000000-0000-0000-0000-000000000001/"
            "10000000-0000-0000-0000-000000000001/source.pdf"
        ),
        original_filename="backend-resume.pdf",
        mime_type=ResumeMimeType.PDF,
        size_bytes=2048,
        sha256="a" * 64,
        status=ResumeStatus.UPLOADED,
        created_at=created_at,
        updated_at=created_at,
    )


def resume_record(resume: Resume) -> dict[str, Any]:
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


def make_version(resume: Resume) -> ResumeVersion:
    return ResumeVersion(
        id="30000000-0000-0000-0000-000000000001",
        resume_id=resume.id,
        version_number=1,
        optimized_json={"summary": "Optimized summary"},
        source_job_id="40000000-0000-0000-0000-000000000001",
        diff_json={"sections": []},
        created_at=resume.created_at,
    )


def version_record(version: ResumeVersion) -> dict[str, Any]:
    return {
        "id": version.id,
        "resume_id": version.resume_id,
        "version_number": version.version_number,
        "optimized_json": version.optimized_json,
        "source_job_id": version.source_job_id,
        "diff_json": version.diff_json,
        "created_at": version.created_at.isoformat(),
    }


@pytest.mark.asyncio
async def test_create_maps_database_record_to_domain_entity() -> None:
    resume = make_resume()
    client = FakeClient(FakeResult([resume_record(resume)]))
    repository = SupabaseResumeRepository(client)

    created = await repository.create(resume)

    assert created == resume
    assert client.queries[0].table_name == "resumes"
    inserted_record = client.queries[0].operations[0][1][0]
    assert inserted_record["mime_type"] == "application/pdf"
    assert inserted_record["status"] == "uploaded"


@pytest.mark.asyncio
async def test_get_by_id_always_filters_by_owner() -> None:
    resume = make_resume()
    client = FakeClient(FakeResult([resume_record(resume)]))
    repository = SupabaseResumeRepository(client)

    found = await repository.get_by_id(resume.id, resume.user_id)

    assert found == resume
    equality_filters = [
        operation[1]
        for operation in client.queries[0].operations
        if operation[0] == "eq"
    ]
    assert ("id", resume.id) in equality_filters
    assert ("user_id", resume.user_id) in equality_filters


@pytest.mark.asyncio
async def test_update_persists_only_mutable_resume_state() -> None:
    resume = make_resume()
    resume.rename("Platform Resume")
    client = FakeClient(FakeResult([resume_record(resume)]))
    repository = SupabaseResumeRepository(client)

    updated = await repository.update(resume)

    assert updated == resume
    update_record = client.queries[0].operations[0][1][0]
    assert set(update_record) == {
        "name",
        "status",
        "parsed_json",
        "parse_error",
        "updated_at",
    }


@pytest.mark.asyncio
async def test_delete_returns_owned_resume() -> None:
    resume = make_resume()
    client = FakeClient(
        FakeResult([resume_record(resume)]),
        FakeResult([resume_record(resume)]),
    )
    repository = SupabaseResumeRepository(client)

    deleted = await repository.delete(resume.id, resume.user_id)

    assert deleted == resume
    assert [query.table_name for query in client.queries] == [
        "resumes",
        "resumes",
    ]
    assert client.queries[1].operations[0][0] == "delete"


@pytest.mark.asyncio
async def test_create_version_requires_an_owned_resume() -> None:
    resume = make_resume()
    version = make_version(resume)
    client = FakeClient(FakeResult([]))
    repository = SupabaseResumeRepository(client)

    with pytest.raises(ResumeNotFoundError):
        await repository.create_version(version, resume.user_id)

    assert len(client.queries) == 1
    assert client.queries[0].table_name == "resumes"


@pytest.mark.asyncio
async def test_create_version_translates_unique_constraint_conflict() -> None:
    resume = make_resume()
    version = make_version(resume)
    conflict = APIError(
        {
            "message": "duplicate key value violates unique constraint",
            "code": "23505",
            "hint": None,
            "details": None,
        }
    )
    client = FakeClient(
        FakeResult([resume_record(resume)]),
        conflict,
    )
    repository = SupabaseResumeRepository(client)

    with pytest.raises(ResumeVersionConflictError):
        await repository.create_version(version, resume.user_id)


@pytest.mark.asyncio
async def test_list_versions_checks_ownership_and_orders_descending() -> None:
    resume = make_resume()
    version = make_version(resume)
    client = FakeClient(
        FakeResult([resume_record(resume)]),
        FakeResult([version_record(version)]),
    )
    repository = SupabaseResumeRepository(client)

    versions = await repository.list_versions(resume.id, resume.user_id)

    assert versions == [version]
    version_query = client.queries[1]
    assert version_query.table_name == "resume_versions"
    assert ("order", ("version_number",), {"desc": True}) in (version_query.operations)
