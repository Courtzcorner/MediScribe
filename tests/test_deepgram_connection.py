#!/usr/bin/env python3
"""
End-to-end verification script for the Deepgram Nova-2 WebSocket pipeline.

Usage:
    1. Ensure DEEPGRAM_API_KEY is set in .env
    2. Start the backend:  uvicorn main:app --reload
    3. Run this script:    python tests/test_deepgram_connection.py

The script connects to ws://localhost:8000/ws/transcribe, sends a short
synthesised sine-wave audio clip (simulating mic input), and prints every
transcript event it receives.
"""
from __future__ import annotations

import asyncio
import json
import struct
import sys
import time
import math

try:
    import websockets
except ImportError:
    print("ERROR: 'websockets' package is required.  pip install websockets")
    sys.exit(1)

WS_URL = "ws://localhost:8000/ws/transcribe"
SAMPLE_RATE = 16000
DURATION_SECONDS = 3
CHUNK_MS = 100  # send a chunk every 100ms
CHANNELS = 1


def generate_sine_wav_frames(
    freq: float = 440.0,
    duration: float = DURATION_SECONDS,
    sample_rate: int = SAMPLE_RATE,
    chunk_ms: int = CHUNK_MS,
) -> list[bytes]:
    """Generate raw linear16 PCM frames of a sine wave (for connection testing)."""
    samples_per_chunk = int(sample_rate * chunk_ms / 1000)
    total_chunks = int(duration * 1000 / chunk_ms)
    chunks: list[bytes] = []

    for c in range(total_chunks):
        buf = bytearray()
        for s in range(samples_per_chunk):
            t = (c * samples_per_chunk + s) / sample_rate
            value = int(16000 * math.sin(2 * math.pi * freq * t))
            buf.extend(struct.pack("<h", max(-32768, min(32767, value))))
        chunks.append(bytes(buf))

    return chunks


async def main() -> None:
    print(f"🔌 Connecting to {WS_URL} ...")
    start = time.monotonic()

    try:
        async with websockets.connect(WS_URL) as ws:
            connect_time = time.monotonic() - start
            print(f"✅ Connected in {connect_time:.3f}s")

            audio_chunks = generate_sine_wav_frames()
            events_received: list[dict] = []
            first_event_time: float | None = None

            async def send_audio():
                for i, chunk in enumerate(audio_chunks):
                    await ws.send(chunk)
                    if i == 0:
                        print(f"📤 Sending audio ({len(audio_chunks)} chunks, "
                              f"{CHUNK_MS}ms each, {DURATION_SECONDS}s total) ...")
                    await asyncio.sleep(CHUNK_MS / 1000)
                # Signal end of audio by closing the send side
                print("📤 All audio sent, waiting for transcripts ...")

            async def receive_transcripts():
                nonlocal first_event_time
                try:
                    async for raw in ws:
                        event = json.loads(raw)
                        if first_event_time is None:
                            first_event_time = time.monotonic()

                        events_received.append(event)
                        etype = event.get("type", "?")
                        text = event.get("text", "")
                        conf = event.get("confidence", "")

                        icon = {"interim": "💬", "final": "✅", "error": "❌", "close": "🔒"}.get(etype, "❓")
                        print(f"  {icon} [{etype:7s}] {text}  (confidence={conf})")

                        if etype in ("close", "error"):
                            break
                except websockets.exceptions.ConnectionClosed:
                    pass

            send_task = asyncio.create_task(send_audio())
            recv_task = asyncio.create_task(receive_transcripts())

            # Wait for sending to finish, then give extra time for final transcripts
            await send_task
            await asyncio.sleep(2)
            recv_task.cancel()
            try:
                await recv_task
            except asyncio.CancelledError:
                pass

            # ── Report ────────────────────────────────────────────────────────
            total_time = time.monotonic() - start
            finals = [e for e in events_received if e.get("type") == "final"]
            interims = [e for e in events_received if e.get("type") == "interim"]
            errors = [e for e in events_received if e.get("type") == "error"]

            print("\n" + "=" * 60)
            print("📊  RESULTS")
            print("=" * 60)
            print(f"  Connection time : {connect_time:.3f}s")
            if first_event_time:
                print(f"  First event at  : {first_event_time - start:.3f}s")
            print(f"  Total time      : {total_time:.3f}s")
            print(f"  Events received : {len(events_received)}")
            print(f"    interim       : {len(interims)}")
            print(f"    final         : {len(finals)}")
            print(f"    errors        : {len(errors)}")

            if errors:
                print("\n⚠️  Errors detected:")
                for e in errors:
                    print(f"    - {e.get('text')}")

            if finals or interims:
                print("\n🎉 Pipeline is working! Deepgram Nova-2 is connected and returning transcripts.")
            else:
                print("\n⚠️  No transcript events received. This is expected for a sine wave test tone.")
                print("    The connection was successful — try with real speech audio for transcripts.")

            print("=" * 60)

    except ConnectionRefusedError:
        print("❌ Connection refused. Is the backend running?")
        print("   Start it with:  uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        sys.exit(1)
    except Exception as exc:
        print(f"❌ Error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
