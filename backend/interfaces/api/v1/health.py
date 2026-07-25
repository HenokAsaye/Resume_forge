from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"status": "ok", "service": "ResumeAI API"}}
    )

    status: str
    service: str


class VersionedHealthResponse(HealthResponse):
    version: str


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check service health",
    response_description="Current API health status",
)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="ResumeAI API")


@router.get(
    "/api/v1/health",
    response_model=VersionedHealthResponse,
    summary="Check versioned service health",
    response_description="Current API health status and version",
)
async def health_check_v1() -> VersionedHealthResponse:
    return VersionedHealthResponse(
        status="ok",
        service="ResumeAI API",
        version="1.0.0",
    )
