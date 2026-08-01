import logging

from application.exceptions import (
    AIConfigurationError,
    DocumentTextExtractionError,
    EmptyFileError,
    FileStorageError,
    FileTooLargeError,
    InvalidFileContentError,
    LLMAuthenticationError,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponseError,
    StoredFileNotFoundError,
    UnsupportedFileTypeError,
)
from domain.exceptions import (
    ATSReportNotFoundError,
    CareerRepositoryError,
    CoverLetterNotFoundError,
    JobNotFoundError,
    JobNotParsedError,
    ResumeNotFoundError,
    ResumeNotParsedError,
    ResumeRepositoryError,
    ResumeVersionConflictError,
    ResumeVersionNotFoundError,
)
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(
        EmptyFileError,
        _bad_file_handler,
    )
    app.add_exception_handler(
        InvalidFileContentError,
        _bad_file_handler,
    )
    app.add_exception_handler(
        FileTooLargeError,
        _file_too_large_handler,
    )
    app.add_exception_handler(
        UnsupportedFileTypeError,
        _unsupported_file_handler,
    )
    app.add_exception_handler(
        ResumeNotFoundError,
        _not_found_handler,
    )
    app.add_exception_handler(
        StoredFileNotFoundError,
        _not_found_handler,
    )
    app.add_exception_handler(
        ResumeVersionNotFoundError,
        _not_found_handler,
    )
    app.add_exception_handler(
        JobNotFoundError,
        _not_found_handler,
    )
    app.add_exception_handler(
        ATSReportNotFoundError,
        _not_found_handler,
    )
    app.add_exception_handler(
        CoverLetterNotFoundError,
        _not_found_handler,
    )
    app.add_exception_handler(
        ResumeNotParsedError,
        _conflict_handler,
    )
    app.add_exception_handler(
        JobNotParsedError,
        _conflict_handler,
    )
    app.add_exception_handler(
        ResumeVersionConflictError,
        _conflict_handler,
    )
    app.add_exception_handler(
        AIConfigurationError,
        _repository_error_handler,
    )
    app.add_exception_handler(
        LLMRateLimitError,
        _rate_limit_handler,
    )
    app.add_exception_handler(
        LLMAuthenticationError,
        _upstream_error_handler,
    )
    app.add_exception_handler(
        LLMProviderError,
        _upstream_error_handler,
    )
    app.add_exception_handler(
        LLMResponseError,
        _upstream_error_handler,
    )
    app.add_exception_handler(
        DocumentTextExtractionError,
        _upstream_error_handler,
    )
    app.add_exception_handler(
        FileStorageError,
        _storage_error_handler,
    )
    app.add_exception_handler(
        ResumeRepositoryError,
        _repository_error_handler,
    )
    app.add_exception_handler(
        CareerRepositoryError,
        _repository_error_handler,
    )


async def _bad_file_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    return _error_response(status.HTTP_400_BAD_REQUEST, exc)


async def _file_too_large_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    return _error_response(status.HTTP_413_CONTENT_TOO_LARGE, exc)


async def _unsupported_file_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    return _error_response(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, exc)


async def _not_found_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    return _error_response(status.HTTP_404_NOT_FOUND, exc)


async def _conflict_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    return _error_response(status.HTTP_409_CONFLICT, exc)


async def _rate_limit_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    return _error_response(status.HTTP_429_TOO_MANY_REQUESTS, exc)


async def _upstream_error_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    logger.warning(
        "Upstream failure: method=%s path=%s error=%s detail=%s",
        request.method,
        request.url.path,
        exc.__class__.__name__,
        str(exc),
    )
    return _error_response(status.HTTP_502_BAD_GATEWAY, exc)


async def _storage_error_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    return _error_response(status.HTTP_502_BAD_GATEWAY, exc)


async def _repository_error_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    return _error_response(status.HTTP_503_SERVICE_UNAVAILABLE, exc)


def _error_response(status_code: int, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"detail": str(exc)},
    )
