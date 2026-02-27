"""
Simple in-memory rate limiter middleware using a sliding-window counter.
In production, use Redis-backed rate limiting (e.g. fastapi-limiter).
"""
from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from config.settings import get_settings

settings = get_settings()

_lock = Lock()
_request_log: dict[str, deque[float]] = defaultdict(deque)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter.
    Limits per IP: RATE_LIMIT_REQUESTS requests per RATE_LIMIT_WINDOW_SECONDS.
    """

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        window = settings.rate_limit_window_seconds
        limit = settings.rate_limit_requests

        with _lock:
            timestamps = _request_log[client_ip]
            # Remove timestamps outside the window
            while timestamps and timestamps[0] < now - window:
                timestamps.popleft()

            if len(timestamps) >= limit:
                retry_after = int(window - (now - timestamps[0])) + 1
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "RateLimitExceeded",
                        "detail": f"Too many requests. Retry after {retry_after}s.",
                    },
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(now)

        return await call_next(request)
