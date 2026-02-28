"""
JWT authentication middleware.
Validates Bearer tokens on all non-public routes.
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from backend.utils.logger import get_logger
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()

_bearer = HTTPBearer(auto_error=False)

PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}

# MVP: allow unauthenticated access to core API (sessions, transcribe, analyze)
PUBLIC_PATH_PREFIXES = ("/sessions", "/transcribe", "/analyze")


def _is_public_path(path: str) -> bool:
    if path in PUBLIC_PATHS:
        return True
    
    # Check prefixes - handle both /sessions and /sessions/
    normalized_path = path.rstrip("/")
    return any(normalized_path == prefix or normalized_path.startswith(prefix + "/") for prefix in PUBLIC_PATH_PREFIXES)


class AuthMiddleware(BaseHTTPMiddleware):
    """Global middleware that validates JWT on protected routes."""

    async def dispatch(self, request: Request, call_next):
        if _is_public_path(request.url.path) or request.method == "OPTIONS":
            # MVP: inject default user when no token on public API paths
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1]
                try:
                    payload = jwt.decode(
                        token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
                    )
                    request.state.user = payload
                except JWTError:
                    request.state.user = {"sub": "mvp-user"}
            else:
                request.state.user = {"sub": "mvp-user"}
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return _unauthorized()

        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
            )
            request.state.user = payload
        except JWTError as e:
            logger.warning("jwt_invalid", error=str(e))
            return _unauthorized()

        return await call_next(request)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """FastAPI dependency to get the current authenticated user."""
    # MVP: use user from middleware for public API paths (sessions, transcribe, analyze)
    if _is_public_path(request.url.path) and hasattr(request.state, "user"):
        return request.state.user
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_access_token(user_id: str, extra_claims: dict | None = None) -> str:
    """Create a signed JWT access token."""
    from datetime import datetime, timedelta
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes),
        "iat": datetime.utcnow(),
        **(extra_claims or {}),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _unauthorized():
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"error": "Unauthorized", "detail": "Valid Bearer token required"},
        headers={"WWW-Authenticate": "Bearer"},
    )
