from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from application.exceptions import (
    EmptyFileError,
    FileStorageError,
    FileTooLargeError,
    InvalidFileContentError,
    StoredFileNotFoundError,
    UnsupportedFileTypeError,
)
from domain.exceptions import ResumeNotFoundError, ResumeRepositoryError


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
        FileStorageError,
        _storage_error_handler,
    )
    app.add_exception_handler(
        ResumeRepositoryError,
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
