"""
Audio preprocessing: format conversion, noise normalization,
chunking for long recordings, and validation.
"""
from __future__ import annotations

import io
import os
import subprocess
import tempfile
from pathlib import Path

from backend.utils.logger import get_logger
from backend.utils.error_handler import TranscriptionError

logger = get_logger(__name__)

SUPPORTED_INPUT_FORMATS = {".mp3", ".mp4", ".wav", ".webm", ".ogg", ".flac", ".m4a"}
TARGET_FORMAT = "wav"
TARGET_SAMPLE_RATE = 16000
TARGET_CHANNELS = 1  # mono


class AudioPreprocessor:
    """
    Converts raw audio blobs to a standardised WAV format
    suitable for Amazon Transcribe.
    """

    def preprocess(self, audio_bytes: bytes, input_format: str = "webm") -> bytes:
        """
        Convert *audio_bytes* from *input_format* to 16kHz mono WAV.
        Requires ffmpeg to be installed on the system.
        """
        with tempfile.NamedTemporaryFile(suffix=f".{input_format}", delete=False) as src:
            src.write(audio_bytes)
            src_path = src.name

        out_path = src_path.replace(f".{input_format}", ".wav")
        try:
            self._run_ffmpeg(src_path, out_path)
            with open(out_path, "rb") as f:
                return f.read()
        except subprocess.CalledProcessError as e:
            raise TranscriptionError(f"Audio conversion failed: {e.stderr.decode()}") from e
        finally:
            for p in (src_path, out_path):
                try:
                    os.unlink(p)
                except FileNotFoundError:
                    pass

    def chunk_audio(
        self,
        audio_bytes: bytes,
        chunk_duration_s: int = 300,
        input_format: str = "wav",
    ) -> list[bytes]:
        """
        Split audio into fixed-length chunks (default 5 min each).
        Useful for recordings longer than Transcribe's 4-hour limit
        or to parallelize shorter chunks.
        """
        with tempfile.NamedTemporaryFile(suffix=f".{input_format}", delete=False) as src:
            src.write(audio_bytes)
            src_path = src.name

        chunks: list[bytes] = []
        chunk_index = 0
        try:
            while True:
                out_path = f"{src_path}_chunk{chunk_index}.wav"
                start = chunk_index * chunk_duration_s
                cmd = [
                    "ffmpeg", "-y",
                    "-i", src_path,
                    "-ss", str(start),
                    "-t", str(chunk_duration_s),
                    "-ar", str(TARGET_SAMPLE_RATE),
                    "-ac", str(TARGET_CHANNELS),
                    out_path,
                ]
                result = subprocess.run(cmd, capture_output=True)
                if result.returncode != 0 or not os.path.exists(out_path):
                    break
                with open(out_path, "rb") as f:
                    data = f.read()
                if len(data) < 1024:   # empty / too small → done
                    break
                chunks.append(data)
                os.unlink(out_path)
                chunk_index += 1
        finally:
            try:
                os.unlink(src_path)
            except FileNotFoundError:
                pass

        logger.info("audio_chunked", num_chunks=len(chunks))
        return chunks

    def get_duration(self, audio_bytes: bytes, input_format: str = "wav") -> float:
        """Return audio duration in seconds using ffprobe."""
        with tempfile.NamedTemporaryFile(suffix=f".{input_format}", delete=False) as src:
            src.write(audio_bytes)
            src_path = src.name
        try:
            result = subprocess.run(
                [
                    "ffprobe", "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    src_path,
                ],
                capture_output=True,
                text=True,
                check=True,
            )
            return float(result.stdout.strip())
        except (subprocess.CalledProcessError, ValueError):
            return 0.0
        finally:
            try:
                os.unlink(src_path)
            except FileNotFoundError:
                pass

    @staticmethod
    def _run_ffmpeg(src: str, out: str) -> None:
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", src,
                "-ar", str(TARGET_SAMPLE_RATE),
                "-ac", str(TARGET_CHANNELS),
                "-c:a", "pcm_s16le",
                out,
            ],
            check=True,
            capture_output=True,
        )
