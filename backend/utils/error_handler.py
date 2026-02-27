from __future__ import annotations

from fastapi import Request, status
from fastapi.responses import JSONResponse
from backend.utils.logger import get_logger

logger = get_logger(__name__)


# ── Custom Exceptions ─────────────────────────────────────────────────────────

class MediScribeError(Exception):
    """Base exception for all MediScribe errors."""
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)


class NotFoundError(MediScribeError):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found."


class ValidationError(MediScribeError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Validation failed."


class TranscriptionError(MediScribeError):
    status_code = status.HTTP_502_BAD_GATEWAY
    detail = "Transcription service failed."


class AnalysisError(MediScribeError):
    status_code = status.HTTP_502_BAD_GATEWAY
    detail = "Analysis service failed."


class StorageError(MediScribeError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    detail = "Storage operation failed."


class AuthError(MediScribeError):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Authentication required."


class ForbiddenError(MediScribeError):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Access denied."


# ── FastAPI Exception Handlers ────────────────────────────────────────────────

async def mediscribe_exception_handler(
    request: Request, exc: MediScribeError
) -> JSONResponse:
    logger.error(
        "handled_error",
        error_type=type(exc).__name__,
        detail=exc.detail,
        path=request.url.path,
        method=request.method,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": type(exc).__name__, "detail": exc.detail},
    )


async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    logger.exception(
        "unhandled_error",
        path=request.url.path,
        method=request.method,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "InternalServerError", "detail": "An unexpected error occurred."},
    )
