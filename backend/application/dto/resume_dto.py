from pydantic import BaseModel


class ResumeUploadResponse(BaseModel):
    id: str
    name: str
    file_url: str | None = None


class ResumeListResponse(BaseModel):
    id: str
    name: str
    created_at: str
    parsed: bool
