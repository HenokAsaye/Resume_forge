from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from interfaces.api.v1.auth import router as auth_router
from interfaces.api.v1.health import router as health_router

API_DESCRIPTION = """
ResumeAI helps users upload, parse, analyze, and optimize resumes against job
descriptions.

## Authentication

Call `POST /api/v1/auth/login` or `POST /api/v1/auth/register`, then select
**Authorize** and enter the returned access token as a Bearer token.

## Error format

Application errors use `{"detail": "Human-readable message"}`. Request
validation errors use FastAPI's standard `422` response.
"""

OPENAPI_TAGS = [
    {
        "name": "health",
        "description": "Public service availability and connectivity checks.",
    },
    {
        "name": "auth",
        "description": "Supabase-backed registration, login, refresh, and user identity.",
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description=API_DESCRIPTION,
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc",
        openapi_url="/api/v1/openapi.json",
        openapi_tags=OPENAPI_TAGS,
        swagger_ui_parameters={
            "displayRequestDuration": True,
            "filter": True,
            "persistAuthorization": True,
        },
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(auth_router)

    return app


app = create_app()
