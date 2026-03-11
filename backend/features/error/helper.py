from typing import NoReturn

from fastapi import HTTPException

from backend.features.error.response import ErrorResponse

def api_error(status_code: int, code: str, message: str, details: dict = None) -> NoReturn:
    exc = HTTPException(
        status_code=status_code,
        detail=ErrorResponse(
            code=code,
            message=message,
            details=details
        ).dict()
    )
    raise exc from None