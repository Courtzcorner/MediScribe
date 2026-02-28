"""
Deepgram Nova-2 client for medical transcription.

Handles both:
1. Real-time streaming (via AsyncDeepgramClient and WebSocket)
2. Batch/Pre-recorded transcription (via synchronous DeepgramClient)

The real-time path is used by api/routes/realtime.py.
The batch path is used by backend/pipeline/orchestrator.py.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

from deepgram import AsyncDeepgramClient, DeepgramClient
from deepgram.listen.v1.types.listen_v1results import ListenV1Results

from backend.models.transcript import Transcript, TranscriptSegment, SpeakerRole
from backend.utils.logger import get_logger
from backend.utils.error_handler import TranscriptionError
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class DeepgramNovaClient:
    """
    Manages Deepgram Nova-2 transcription sessions.
    """

    def __init__(self) -> None:
        api_key = settings.deepgram_api_key
        if not api_key:
            raise TranscriptionError(
                "DEEPGRAM_API_KEY is not set. "
                "Add it to your .env file to enable transcription."
            )
        self._api_key = api_key

    # ── Batch Transcription (Synchronous fallback for Orchestrator) ──────────

    def transcribe(self, audio_bytes: bytes, session_id: str, audio_s3_uri: str | None = None) -> Transcript:
        """
        Transcribe audio using Deepgram Pre-recorded API.
        Maps Deepgram's native utterances to the MediScribe Transcript model.
        """
        client = DeepgramClient(self._api_key)

        try:
            if audio_bytes:
                response = client.listen.v1.media.transcribe_file(
                    request=audio_bytes,
                    model="nova-2-medical",
                    smart_format=True,
                    diarize=True,
                    utterances=True,
                    punctuate=True,
                    language="en-US",
                )
            elif audio_s3_uri:
                response = client.listen.v1.media.transcribe_url(
                    url={"url": audio_s3_uri},
                    model="nova-2-medical",
                    smart_format=True,
                    diarize=True,
                    utterances=True,
                    punctuate=True,
                    language="en-US",
                )
            else:
                raise TranscriptionError("Either audio_bytes or audio_s3_uri is required")

            if not response.results:
                raise TranscriptionError("Deepgram returned no results")

            # Deepgram SDK v6 returns typed objects. Extract utterances.
            segments = []
            if hasattr(response.results, "utterances") and response.results.utterances:
                for utt in response.results.utterances:
                    segments.append(TranscriptSegment(
                        speaker=SpeakerRole.DOCTOR if utt.speaker == 0 else SpeakerRole.PATIENT,
                        text=utt.transcript,
                        start_time=float(utt.start),
                        end_time=float(utt.end),
                        confidence=float(utt.confidence),
                    ))
            else:
                # Fallback to single channel transcript if utterances aren't available
                channel = response.results.channels[0]
                alt = channel.alternatives[0]
                segments.append(TranscriptSegment(
                    speaker=SpeakerRole.UNKNOWN,
                    text=alt.transcript,
                    start_time=0.0,
                    end_time=0.0,
                    confidence=float(alt.confidence),
                ))

            logger.info("deepgram_batch_complete", session_id=session_id, segments=len(segments))
            return Transcript.from_segments(session_id, segments)

        except Exception as e:
            logger.error("deepgram_batch_error", session_id=session_id, error=str(e))
            raise TranscriptionError(f"Deepgram transcription failed: {e}") from e

    # ── Real-time Streaming ──────────────────────────────────────────────────

    class Session:
        """Active streaming session wrapping an AsyncV1SocketClient."""

        def __init__(self, session_id: str) -> None:
            self.session_id = session_id
            self.events: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
            self._ws = None
            self._recv_task: asyncio.Task | None = None

        async def send_audio(self, chunk: bytes) -> None:
            """Send a raw audio chunk to the Deepgram stream."""
            if self._ws is None:
                raise TranscriptionError("Deepgram session is not open")
            self._ws.send_media(chunk)

        async def close(self) -> None:
            """Signal end-of-stream and clean up."""
            if self._ws is not None:
                self._ws.send_close_stream()
            if self._recv_task is not None:
                self._recv_task.cancel()
                try:
                    await self._recv_task
                except asyncio.CancelledError:
                    pass
            await self.events.put({"type": "close", "text": ""})
            logger.info("deepgram_session_closed", session_id=self.session_id)

        async def _receive_loop(self) -> None:
            """Background task: read transcript events from Deepgram."""
            try:
                while True:
                    msg = await self._ws.recv()

                    if not isinstance(msg, ListenV1Results):
                        continue

                    alts = msg.channel.alternatives
                    if not alts:
                        continue

                    transcript_text = alts[0].transcript
                    if not transcript_text:
                        continue

                    is_final = bool(msg.is_final)
                    confidence = float(alts[0].confidence) if hasattr(alts[0], "confidence") else 0.0

                    event = {
                        "type": "final" if is_final else "interim",
                        "text": transcript_text,
                        "confidence": round(confidence, 4),
                        "speech_final": bool(msg.speech_final) if msg.speech_final else False,
                    }
                    await self.events.put(event)

                    logger.debug(
                        "deepgram_transcript",
                        session_id=self.session_id,
                        is_final=is_final,
                        text=transcript_text[:80],
                    )

            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.error(
                    "deepgram_recv_error",
                    session_id=self.session_id,
                    error=str(exc),
                )
                await self.events.put({"type": "error", "text": str(exc)})

    class _SessionContext:
        """Async context manager that owns the Deepgram WebSocket lifecycle."""

        def __init__(self, api_key: str, session_id: str) -> None:
            self._api_key = api_key
            self._session_id = session_id
            self._dg_ctx = None
            self.session: DeepgramNovaClient.Session | None = None

        async def __aenter__(self) -> "DeepgramNovaClient.Session":
            dg = AsyncDeepgramClient(api_key=self._api_key)

            self._dg_ctx = dg.listen.v1.connect(
                model="nova-2-general",
                language="en-US",
                smart_format="true",
                interim_results="true",
                endpointing="300",
                encoding="linear16",
                sample_rate="16000",
                channels="1",
            )

            ws = await self._dg_ctx.__aenter__()

            session = DeepgramNovaClient.Session(self._session_id)
            session._ws = ws
            session._recv_task = asyncio.create_task(session._receive_loop())
            self.session = session

            logger.info(
                "deepgram_connected",
                session_id=self._session_id,
                model="nova-2-general",
            )

            return session

        async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
            if self.session is not None:
                await self.session.close()
            if self._dg_ctx is not None:
                await self._dg_ctx.__aexit__(exc_type, exc_val, exc_tb)

    def connect(self, session_id: str) -> "_SessionContext":
        """
        Return an async context manager that opens a Deepgram stream.

        Usage:
            async with client.connect("abc") as session:
                await session.send_audio(chunk)
                event = await session.events.get()
        """
        return self._SessionContext(self._api_key, session_id)
