"""
Exception hierarchy for application-level error handling
All services should raise these exceptions (not HTTPException).
Routers catch these and translate to HTTP responses.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from typing import Optional


class AppError(Exception):
    """Base application error - never raise directly, use subclasses"""

    def __init__(self, status_code: int, detail: str, error_code: str = "APP_ERROR"):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        super().__init__(detail)


class NotFoundError(AppError):
    """Resource does not exist (404)"""

    def __init__(self, resource: str, identifier: Optional[str] = None):
        detail = f"{resource} not found"
        if identifier:
            detail += f" (id: {identifier})"
        super().__init__(404, detail, "NOT_FOUND")


class ValidationError(AppError):
    """Input validation failed (400)"""

    def __init__(self, detail: str):
        super().__init__(400, detail, "VALIDATION_ERROR")


class PermissionError(AppError):
    """User lacks permission for this operation (403)"""

    def __init__(self, detail: str = "Access denied"):
        super().__init__(403, detail, "PERMISSION_DENIED")


class AuthenticationError(AppError):
    """User is not authenticated (401)"""

    def __init__(self, detail: str = "Authentication required"):
        super().__init__(401, detail, "AUTHENTICATION_REQUIRED")


class ConflictError(AppError):
    """Resource already exists or state conflict (409)"""

    def __init__(self, detail: str):
        super().__init__(409, detail, "CONFLICT")


class QuotaExceededError(AppError):
    """User exceeded quota/credits (402)"""

    def __init__(self, detail: str = "Insufficient credits"):
        super().__init__(402, detail, "QUOTA_EXCEEDED")


class ExternalServiceError(AppError):
    """External service (Gemini, Stripe, etc.) error (502)"""

    def __init__(self, service: str, detail: Optional[str] = None):
        msg = f"{service} service error"
        if detail:
            msg += f": {detail}"
        super().__init__(502, msg, "EXTERNAL_SERVICE_ERROR")


class DatabaseError(AppError):
    """Database operation failed (500)"""

    def __init__(self, detail: str = "Database error"):
        super().__init__(500, detail, "DATABASE_ERROR")


def register_exception_handlers(app: FastAPI):
    """Register global exception handlers with FastAPI"""

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "error_code": exc.error_code,
            },
        )
