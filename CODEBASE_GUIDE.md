# MediScribe Codebase Guide

A comprehensive reference for developers joining the MediScribe project. Covers structure, data flow, modules, models, dependencies, configuration, and known gaps.

---

## 1. Project Structure

```
MediScribe/
├── main.py                    # FastAPI entry point
├── Makefile                   # Development commands (dev, test, migrate, etc.)
├── docker-compose.yml         # PostgreSQL, Redis, backend, frontend, Celery worker
├── requirements.txt           # Python dependencies
├── .env.example               # Template for environment variables
│
├── api/                       # FastAPI layer
│   ├── __init__.py            # create_app(), routers, middleware
│   ├── routes/                # API route handlers
│   │   ├── sessions.py        # CRUD for PatientSession
│   │   ├── transcribe.py      # POST upload+transcribe, GET transcript
│   │   └── analyze.py         # POST /stream for SSE analysis
│   └── middleware/
│       ├── auth.py            # JWT validation, get_current_user, PUBLIC_PATHS
│       └── rate_limiter.py    # Rate limiting
│
├── backend/                   # Business logic
│   ├── models/                # Pydantic domain models
│   │   ├── patient_session.py # PatientSession, CreateSessionRequest, SessionStatus
│   │   ├── transcript.py      # Transcript, TranscriptSegment, SpeakerRole
│   │   └── analysis_result.py # AnalysisResult, SOAPNote, Medication, Diagnosis, FollowUp
│   ├── pipeline/              # Orchestration & background jobs
│   │   ├── orchestrator.py    # MedicalPipelineOrchestrator (sync pipeline)
│   │   ├── tasks.py           # Celery tasks (transcribe_and_analyse, analyse_transcript)
│   │   └── job_manager.py     # Celery app, submit_pipeline_job, get_job_status
│   ├── transcription/         # Speech-to-text
│   │   ├── nova_client.py     # NovaTranscribeClient (Amazon Transcribe)
│   │   ├── audio_preprocessor.py # ffmpeg: convert to 16kHz mono WAV
│   │   └── transcript_formatter.py # Clean text, expand medical abbreviations
│   ├── analysis/              # AI clinical documentation
│   │   ├── claude_client.py   # ClaudeClient (Bedrock invoke + stream)
│   │   ├── response_parser.py # Parse Claude JSON → AnalysisResult
│   │   └── prompts/           # system_prompt.txt, soap_note.txt, etc.
│   ├── storage/
│   │   ├── db_handler.py      # SQLAlchemy CRUD (sessions, transcripts, analysis)
│   │   └── s3_handler.py      # S3 upload, presigned URLs, AES-256
│   └── utils/
│       ├── logger.py          # structlog
│       ├── error_handler.py   # MediScribeError, NotFoundError, etc.
│       └── hipaa_sanitizer.py # PII redaction for logs
│
├── config/
│   ├── settings.py            # Pydantic Settings (env vars)
│   ├── bedrock_config.py      # Bedrock/Transcribe clients, model IDs
│   └── logging_config.py      # structlog setup
│
├── frontend/                  # Next.js 15 App Router
│   ├── app/                   # Pages & API routes
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   ├── (auth)/            # login, register
│   │   ├── sessions/          # List, new, [id] detail
│   │   └── api/               # Next.js API routes (proxy to backend)
│   │       ├── sessions/      # GET list, POST create, [id] GET/PATCH/DELETE
│   │       ├── transcribe/    # POST multipart
│   │       └── analyze/       # POST SSE stream proxy
│   ├── components/            # React components
│   │   ├── layout/            # Header, Sidebar, SessionCard
│   │   ├── recorder/          # AudioRecorder, RecordingControls, WaveformVisualizer
│   │   ├── transcript/        # TranscriptViewer, TranscriptEditor, SpeakerLabel
│   │   └── analysis/          # AnalysisPanel, SOAPNote, MedicationList, DiagnosisSummary
│   ├── hooks/                 # useRecorder, useAnalysis
│   ├── lib/                   # api-client, streaming, audio-utils
│   ├── store/                 # Zustand (sessionStore, uiStore)
│   └── types/                 # session, transcript, analysis
│
└── tests/                     # pytest unit & integration tests
```

---

## 2. Data Flow

### End-to-end: User records audio → response

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. USER RECORDS AUDIO                                                                        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
   Browser mic → useRecorder (MediaRecorder API)
   → AudioRecorder component → FormData (audio blob + sessionId)

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND UPLOAD                                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
   POST /api/transcribe (Next.js route)
   → Proxies to POST http://localhost:8000/transcribe/{sessionId}
   → Backend: api/routes/transcribe.py → transcribe_audio()

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. BACKEND PIPELINE (synchronous)                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
   MedicalPipelineOrchestrator.process_recording(session, audio_bytes, ext)
   │
   ├─ AudioPreprocessor.preprocess()     → ffmpeg → 16kHz mono WAV
   ├─ S3Handler.upload_audio()           → s3://bucket/audio/{session_id}.wav
   ├─ NovaTranscribeClient               → Amazon Transcribe (speaker diarization, PII redaction)
   ├─ TranscriptFormatter.format()       → clean text, expand abbreviations
   ├─ ClaudeClient.invoke()              → Claude Sonnet 4.6 via Bedrock
   ├─ ResponseParser.parse()             → AnalysisResult
   └─ session.mark_completed(transcript_id, analysis_id)
   │
   DBHandler.save_transcript(transcript)
   DBHandler.save_session(session)
   │
   NOTE: Analysis is produced but NOT saved to DB in transcribe route (see gaps).

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. TRANSCRIBE RESPONSE                                                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
   Returns Transcript (JSON) to frontend.
   Frontend receives transcript, then calls analysis stream.

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ 5. ANALYSIS STREAM (frontend-initiated)                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
   useAnalysis.startAnalysis(sessionId, transcriptId)
   → POST /api/analyze (Next.js) → POST http://localhost:8000/analyze/stream
   → Backend: api/routes/analyze.py → stream_analysis()
   │
   Orchestrator.stream_analysis(session, transcript)
   │
   └─ ClaudeClient.stream()  → yields text chunks
   └─ ResponseParser.parse() → AnalysisResult (at end)
   │
   SSE stream: data: {"type":"chunk","content":"..."}\n\n  (repeated)
   NOTE: Backend does NOT send "complete" event with final JSON (see gaps).

┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND RECEIVES                                                                         │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
   streaming.ts: onChunk() for each chunk; expects onComplete(result) on "complete" event.
   AnalysisPanel renders SOAP note, medications, diagnoses, etc.
   User navigates to /sessions/[id] for full view.
```

### API routes summary

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | /health | health_check | No auth |
| GET | /sessions/ | list_sessions | List sessions for doctor |
| POST | /sessions/ | create_session | Create session |
| GET | /sessions/{id} | get_session | Get single session |
| PATCH | /sessions/{id} | update_session | Update session |
| DELETE | /sessions/{id} | delete_session | Soft delete |
| POST | /transcribe/{session_id} | transcribe_audio | Upload audio, run full pipeline |
| GET | /transcribe/{session_id} | get_transcript | **Not implemented** (raises) |
| POST | /analyze/stream | stream_analysis | SSE stream of Claude analysis |

---

## 3. Key Modules and Responsibilities

### backend/pipeline

- **orchestrator.py**  
  - `MedicalPipelineOrchestrator`: ties preprocessor → S3 → Transcribe → formatter → Claude → parser.  
  - `process_recording()`: sync full pipeline, returns (Transcript, AnalysisResult).  
  - `stream_analysis()`: yields chunks, then parses final AnalysisResult (returned but not sent as SSE "complete" event).

- **tasks.py**  
  Celery tasks for async jobs:  
  - `transcribe_and_analyse`: S3 audio → full pipeline, saves transcript + analysis.  
  - `analyse_transcript`: re-analyse existing transcript.

- **job_manager.py**  
  Celery app, `submit_pipeline_job()`, `get_job_status()`.

### backend/transcription

- **nova_client.py**  
  Wraps Amazon Transcribe: `start_transcription_job()`, `wait_for_job()`, `parse_result()`. Medical specialty, speaker diarization, PII redaction.

- **audio_preprocessor.py**  
  Converts to 16kHz mono WAV via ffmpeg; `chunk_audio()` for long recordings; `get_duration()`.

- **transcript_formatter.py**  
  Whitespace cleanup, medical abbreviation expansion (bid→twice daily, etc.).

### backend/analysis

- **claude_client.py**  
  Bedrock: `invoke()` (sync) and `stream()` (yields text chunks).

- **response_parser.py**  
  Extracts JSON from Claude output (```json...``` or `{...}`), maps to AnalysisResult, SOAPNote, Medication, Diagnosis, FollowUp.

- **prompts/**  
  `system_prompt.txt` defines schema and behavior.

### backend/storage

- **db_handler.py**  
  SQLAlchemy: `SessionRecord`, `TranscriptRecord`, `AnalysisRecord`.  
  - `save_session`, `get_session`, `list_sessions`  
  - `save_transcript`, **no `get_transcript`**  
  - `save_analysis`, **no `get_analysis`**

- **s3_handler.py**  
  Upload audio/JSON, presigned URLs, AES-256.

### api/routes

- **sessions.py**  
  CRUD for PatientSession; requires JWT, filters by `current_user["sub"]`.

- **transcribe.py**  
  POST: multipart form, runs `orchestrator.process_recording()`, saves transcript + session. Analysis is computed but not saved (orchestrator returns it; route doesn’t persist).  
  GET: stub that raises "Transcript record retrieval not yet implemented".

- **analyze.py**  
  POST /stream: fetches session, builds Transcript with **empty segments** (no DB fetch), streams Claude chunks via SSE. Does not send final "complete" event with full AnalysisResult.

### frontend

- **app/**  
  App Router: `/`, `/login`, `/register`, `/sessions`, `/sessions/new`, `/sessions/[id]`.  
  `api/` routes proxy to backend with auth forwarding.

- **components/**  
  - Layout: Header, Sidebar, SessionCard  
  - Recorder: AudioRecorder, RecordingControls, WaveformVisualizer  
  - Transcript: TranscriptViewer, TranscriptEditor, SpeakerLabel  
  - Analysis: AnalysisPanel, SOAPNote, MedicationList, DiagnosisSummary  

- **hooks/**  
  - `useRecorder`: MediaRecorder, blob, duration.  
  - `useAnalysis`: SSE stream, chunk accumulation, expects "complete" event.

- **lib/**  
  - `api-client.ts`: fetch wrapper, JWT from localStorage.  
  - `streaming.ts`: SSE parsing, onChunk/onComplete.  
  - `audio-utils.ts`: MediaRecorder setup, format helpers.

---

## 4. Models / Schemas

### PatientSession

| Field | Type | Description |
|-------|------|-------------|
| id | str (UUID) | Primary key |
| title | str | Session title |
| doctor_id | str | JWT sub |
| patient_id | str \| None | Optional |
| status | SessionStatus | idle, recording, processing, completed, failed |
| duration | int | Seconds |
| audio_url | str \| None | S3 URI |
| transcript_id | str \| None | FK to Transcript |
| analysis_id | str \| None | FK to AnalysisResult |
| notes | str \| None | |
| created_at, updated_at | datetime | |

### Transcript

| Field | Type | Description |
|-------|------|-------------|
| id | str (UUID) | |
| session_id | str | FK to PatientSession |
| segments | list[TranscriptSegment] | Speaker-labeled text chunks |
| raw_text | str | Concatenated |
| language | str | e.g. en-US |
| word_count | int | |
| created_at, updated_at | datetime | |

**TranscriptSegment**: id, speaker (doctor/patient/unknown), text, start_time, end_time, confidence.

### AnalysisResult

| Field | Type | Description |
|-------|------|-------------|
| id | str (UUID) | |
| session_id | str | |
| transcript_id | str | |
| summary | str | Plain-language summary |
| soap_note | SOAPNote | subjective, objective, assessment, plan |
| medications | list[Medication] | name, dosage, frequency, duration, route, instructions |
| diagnoses | list[Diagnosis] | condition, icd_code, severity, status, notes |
| follow_up | FollowUp \| None | timeframe, instructions, referrals, lab_orders, imaging_orders |
| key_points | list[str] | |
| patient_instructions | str \| None | |
| model_used | str | Bedrock model ID |
| created_at | datetime | |

### Relationships

```
PatientSession 1──* Transcript (session_id)
PatientSession 1──* AnalysisResult (session_id)
Transcript 1──1 AnalysisResult (transcript_id)
```

---

## 5. External Dependencies

| Service | Purpose | Config |
|---------|---------|--------|
| **Amazon Transcribe** | STT, speaker diarization, PII redaction | `nova_client.py`, `TRANSCRIBE_LANGUAGE_CODE` |
| **Amazon S3** | Audio storage, AES-256 | `S3_BUCKET_NAME`, `s3_handler.py` |
| **Amazon Bedrock** | Claude Sonnet 4.6 | `BEDROCK_CLAUDE_MODEL_ID`, `bedrock_config.py` |
| **PostgreSQL** | Sessions, transcripts, analysis | `DATABASE_URL`, SQLAlchemy |
| **Redis** | Celery broker | `REDIS_URL` |
| **Celery** | Background jobs | `backend.pipeline.job_manager`, `tasks.py` |
| **ffmpeg** | Audio preprocessing | System dependency |

---

## 6. Configuration

### config/settings.py

Pydantic `Settings` loads from `.env`:

- **App**: `ENVIRONMENT`, `LOG_LEVEL`, `BACKEND_URL`, `FRONTEND_URL`
- **AWS**: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- **Bedrock**: `BEDROCK_CLAUDE_MODEL_ID`, `BEDROCK_NOVA_MODEL_ID`, `TRANSCRIBE_LANGUAGE_CODE`
- **Database**: `DATABASE_URL`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`
- **Redis**: `REDIS_URL`
- **S3**: `S3_BUCKET_NAME`, `S3_REGION`, `S3_PRESIGNED_URL_EXPIRY`
- **Auth**: `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- **Rate limit**: `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`

### config/bedrock_config.py

- `BEDROCK_RUNTIME_CONFIG`: retries, timeouts  
- `CLAUDE_MODEL_ID`, `NOVA_SONIC_MODEL_ID`  
- `CLAUDE_INFERENCE_CONFIG`, `CLAUDE_STRUCTURED_CONFIG`  
- `get_bedrock_client()`, `get_transcribe_client()`

### Env vars

Copy `.env.example` to `.env` and set AWS keys, DB URL, etc. See README and MVP_PLAN.md for minimal setup.

---

## 7. Frontend Structure

### App router

- `app/page.tsx` – Landing  
- `app/(auth)/login/page.tsx`, `register/page.tsx`  
- `app/sessions/page.tsx` – Session list  
- `app/sessions/new/page.tsx` – Create + record  
- `app/sessions/[id]/page.tsx` – Session detail (transcript + analysis tabs)

### API proxy pattern

Frontend calls `/api/*` (Next.js routes), which proxy to `BACKEND_URL`:

- `app/api/sessions/route.ts` – GET/POST list/create  
- `app/api/sessions/[id]/route.ts` – GET/PATCH/DELETE single  
- `app/api/transcribe/route.ts` – POST multipart, forwards `Authorization`  
- `app/api/analyze/route.ts` – POST body, streams SSE from backend

`api-client.ts` uses `NEXT_PUBLIC_BACKEND_URL` for client-side direct calls. In production, typically all calls go through Next.js API routes to avoid CORS and to forward auth.

### Hooks

- **useRecorder**: MediaRecorder, blob, duration, pause/resume  
- **useAnalysis**: POST `/api/analyze`, parses SSE, onChunk/onComplete

### State

- Zustand: `sessionStore`, `uiStore` (e.g. active tab)

---

## 8. Current Gaps / TODOs

### Critical (blocking full flow)

1. **`DBHandler.get_transcript()` missing**  
   `api/routes/transcribe.py` GET raises `NotFoundError("Transcript record retrieval not yet implemented")`.  
   Analyze route builds `Transcript` with `segments=[]`, so Claude gets no transcript text.

2. **Analyze route: empty transcript**  
   `api/routes/analyze.py` uses `Transcript(..., segments=[])` instead of loading from DB. Claude receives empty input.

3. **Analyze stream: no "complete" event**  
   Backend sends only `{"type":"chunk","content":"..."}`.  
   Frontend `streaming.ts` waits for `event.type === 'complete' && event.analysis` and never calls `onComplete()`. Analysis is never finalized in the UI.

4. **Analysis not persisted in transcribe route**  
   `orchestrator.process_recording()` returns (Transcript, AnalysisResult), but `api/routes/transcribe.py` only saves transcript and session. Analysis is discarded.

### Backend

5. **`DBHandler.get_analysis()` missing**  
   Session detail page calls `GET /analyze/{id}` but no such route exists. Need `get_analysis(analysis_id)` and a GET endpoint.

6. **GET /analyze/{session_id} route**  
   Frontend expects to fetch analysis by session; backend has no GET analysis endpoint.

7. **API naming mismatch**  
   Frontend uses `api.get<Analysis>(`/analyze/${id}`)` with session id; backend analyze routes use session_id and transcript_id. Need a consistent GET-by-session or GET-by-analysis-id design.

### Serialization

8. **snake_case vs camelCase**  
   Backend Pydantic models use snake_case; frontend types use camelCase. SessionCard uses `session.createdAt`, `session.patientId`, etc. If backend returns snake_case, these will be undefined. Consider `model_config` with `populate_by_name` and aliases, or a serialization layer.

### MVP / auth

9. **Auth required for all**  
   MVP_PLAN suggests making `/sessions`, `/transcribe`, `/analyze` public or adding `/mvp/*` for anonymous use.

10. **Celery not used in main flow**  
    Transcribe route calls `orchestrator.process_recording()` synchronously. Celery tasks exist but are not triggered by the current API flow.

### Recommended order (from MVP_PLAN)

1. Add `DBHandler.get_transcript()` and use it in analyze route  
2. Add `DBHandler.get_analysis()` and GET `/analyze/{session_id}` (or similar)  
3. Send "complete" SSE event with full AnalysisResult after stream ends  
4. Save analysis in transcribe route (or separate analyze step)  
5. Fix snake_case/camelCase if needed  
6. Auth bypass for MVP if desired  

---

## Quick reference

| Task | File(s) |
|------|---------|
| Add API route | `api/routes/*.py`, `api/__init__.py` |
| Change pipeline logic | `backend/pipeline/orchestrator.py` |
| Change Claude prompt | `backend/analysis/prompts/system_prompt.txt` |
| Add DB table/column | `backend/storage/db_handler.py`, migrations |
| Frontend API call | `frontend/lib/api-client.ts` or `/api/*` routes |
| Session/transcript/analysis types | `frontend/types/*.ts`, `backend/models/*.py` |
| Auth / public paths | `api/middleware/auth.py` |
| Env vars | `.env`, `config/settings.py` |
