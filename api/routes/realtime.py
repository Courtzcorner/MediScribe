"""
Real-time transcription WebSocket endpoint.

Bridges the frontend microphone stream with the Deepgram Nova-2 live
transcription client. Audio chunks flow in, transcript events flow out.
"""
from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.transcription.nova_client import DeepgramNovaClient
from backend.utils.logger import get_logger
from backend.utils.error_handler import TranscriptionError

logger = get_logger(__name__)

router = APIRouter()


@router.websocket("/ws/transcribe")
async def realtime_transcribe(ws: WebSocket) -> None:
    """
    Full-duplex WebSocket endpoint for real-time transcription.

    Protocol:
      ← Binary frames  : raw audio from the browser mic (linear16, 16kHz, mono)
      → JSON text frames: {"type": "interim"|"final"|"error"|"close",
                           "text": "...", "confidence": 0.98}
    """
    await ws.accept()
    session_id = uuid.uuid4().hex[:12]
    logger.info("ws_client_connected", session_id=session_id)

    try:
        client = DeepgramNovaClient()
    except TranscriptionError as exc:
        await ws.send_json({"type": "error", "text": str(exc)})
        await ws.close(code=1011, reason=str(exc))
        return

    try:
        async with client.connect(session_id) as session:

            # ── Two concurrent loops ──────────────────────────────────────

            async def _ingest_audio() -> None:
                """Receive audio frames from the frontend and pipe to Deepgram."""
                try:
                    while True:
                        data = await ws.receive_bytes()
                        await session.send_audio(data)
                except WebSocketDisconnect:
                    logger.info("ws_client_disconnected", session_id=session_id)
                except Exception as exc:
                    logger.error("ws_ingest_error", session_id=session_id, error=str(exc))
                finally:
                    await session.close()

            async def _emit_transcripts() -> None:
                """Read transcript events from Deepgram and send to frontend."""
                try:
                    while True:
                        event = await session.events.get()

                        if event["type"] == "close":
                            break

                        await ws.send_json(event)

                        if event["type"] == "error":
                            logger.warning(
                                "ws_transcript_error",
                                session_id=session_id,
                                error=event["text"],
                            )
                except WebSocketDisconnect:
                    pass
                except Exception as exc:
                    logger.error("ws_emit_error", session_id=session_id, error=str(exc))

            # Run both loops; when one finishes the other is cancelled.
            ingest_task = asyncio.create_task(_ingest_audio())
            emit_task = asyncio.create_task(_emit_transcripts())

            done, pending = await asyncio.wait(
                {ingest_task, emit_task},
                return_when=asyncio.FIRST_COMPLETED,
            )

            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

            for task in done:
                if task.exception():
                    logger.error(
                        "ws_task_exception",
                        session_id=session_id,
                        error=str(task.exception()),
                    )

    except TranscriptionError as exc:
        await ws.send_json({"type": "error", "text": str(exc)})
    except Exception as exc:
        logger.error("ws_session_error", session_id=session_id, error=str(exc))

    logger.info("ws_session_ended", session_id=session_id)
