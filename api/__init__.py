"""
MediScribe FastAPI application factory.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from api.routes import transcribe, analyze, sessions
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
    )

    # ── Middleware ────────────────────────────────────────────────────────────
    # Use explicit origins when credentials=True (browsers reject * with credentials)
    cors_origins = [
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(RateLimiterMiddleware)
    # Temporarily disable auth for debugging
    # app.add_middleware(AuthMiddleware)

    # ── Exception handlers ───────────────────────────────────────────────────
    app.add_exception_handler(MediScribeError, mediscribe_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # ── Routers ──────────────────────────────────────────────────────────────
    app.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
    app.include_router(transcribe.router, prefix="/transcribe", tags=["Transcription"])
    app.include_router(analyze.router, prefix="/analyze", tags=["Analysis"])

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "version": "1.0.0"}

    @app.get("/debug/dynamodb")
    async def debug_dynamodb():
        """Debug endpoint to test DynamoDB connectivity."""
        try:
            from backend.storage.db_handler import DBHandler
            db = DBHandler()
            # Try to list sessions for a test user
            sessions = db.list_sessions(doctor_id="test-user", limit=1)
            return {
                "status": "ok",
                "table_name": settings.dynamodb_table_name,
                "sessions_count": len(sessions),
                "message": "DynamoDB connection successful"
            }
        except Exception as e:
            import traceback
            return {
                "status": "error",
                "error": str(e),
                "traceback": traceback.format_exc()
            }

    return app
