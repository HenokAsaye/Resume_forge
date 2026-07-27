from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ResumeUploadResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "10000000-0000-0000-0000-000000000001",
                "name": "Backend Engineer CV",
                "file_url": (
                    "http://localhost:8000/api/v1/resumes/"
                    "10000000-0000-0000-0000-000000000001/download"
                ),
            }
        }
    )

    id: UUID
    name: str
    file_url: str


class ResumeListResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    parsed: bool


class ResumeDetailResponse(BaseModel):
    id: UUID
    name: str
    original_file_url: str
    parsed_json: dict[str, object] | None
    created_at: datetime
