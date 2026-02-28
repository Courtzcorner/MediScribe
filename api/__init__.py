"""
MediScribe FastAPI application factory.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from api.routes import transcribe, analyze, sessions, realtime
from api.middleware.auth import AuthMiddleware
from api.middleware.rate_limiter import RateLimiterMiddleware
from backend.utils.error_handler import (
    MediScribeError,
    mediscribe_exception_handler,
    unhandled_exception_handler,
)
from config.settings import get_settings

settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title="MediScribe API",
        description="Medical transcription and AI analysis platform",
        version="1.0.0",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        redirect_slashes=False,
    )

    # ── Middleware ────────────────────────────────────────────────────────────
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(RateLimiterMiddleware)
    app.add_middleware(AuthMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ───────────────────────────────────────────────────
    app.add_exception_handler(MediScribeError, mediscribe_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # ── Routers ──────────────────────────────────────────────────────────────
    app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
    app.include_router(transcribe.router, prefix="/transcribe", tags=["Transcription"])
    app.include_router(analyze.router, prefix="/analyze", tags=["Analysis"])
    app.include_router(realtime.router, tags=["Real-time Transcription"])

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "version": "1.0.0"}

    return app
