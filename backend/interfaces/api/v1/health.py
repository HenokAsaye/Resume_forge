from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "ResumeAI API"}


@router.get("/api/v1/health")
async def health_check_v1():
    return {"status": "ok", "service": "ResumeAI API", "version": "1.0.0"}
