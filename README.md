# MediScribe

AI-powered medical transcription and clinical documentation platform.

Records doctor-patient consultations, transcribes them using **Amazon Transcribe**, and generates structured SOAP notes, medication lists, and diagnoses using **Claude Sonnet 4.6** via Amazon Bedrock.

---

## Architecture

```
MediScribe/
├── frontend/        Next.js 15 (App Router) — recording UI + note viewer
├── backend/         Python business logic — transcription, analysis, pipeline
├── api/             FastAPI routes + middleware
├── config/          Settings, Bedrock config, logging
└── tests/           Unit + integration tests
```

**Data flow:**
```
Browser mic → AudioRecorder → POST /transcribe
  → AudioPreprocessor (ffmpeg, 16kHz WAV)
  → S3 upload
  → Amazon Transcribe (speaker diarization + PII redaction)
  → TranscriptFormatter (clean + expand abbreviations)
  → Claude Sonnet 4.6 via Bedrock (streaming SOAP note generation)
  → ResponseParser → AnalysisResult
  → Database (PostgreSQL via SQLAlchemy)
  → SSE stream → AnalysisPanel (React)
```

---

## Quick Start

### 1. Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.12+ |
| Node.js | 20+ |
| Docker + Compose | latest |
| ffmpeg | any recent |
| AWS account | with Bedrock + Transcribe access |

### 2. First-time setup

```bash
# Clone and enter the project
cd MediScribe

# Copy env and fill in your AWS credentials
make env          # copies .env.example → .env
# Edit .env with your AWS keys, model IDs, JWT secret

# Install all dependencies
make install

# Start infrastructure (Postgres + Redis)
make docker-up

# Run database migrations
make migrate

# Start both servers
make dev
```

Frontend → http://localhost:3000
Backend API → http://localhost:8000
API Docs → http://localhost:8000/docs

---

## Run Commands

All commands are available via `make`. Run `make help` to see the full list.

```bash
make help              # List all commands with descriptions

# ── Development ──────────────────────────────────────────────────
make dev               # Start backend + frontend (parallel)
make dev-backend       # FastAPI on :8000 (hot reload)
make dev-frontend      # Next.js on :3000 (hot reload)
make dev-worker        # Celery worker for background jobs

# ── Installation ─────────────────────────────────────────────────
make install           # Install both Python + Node deps
make install-backend   # pip install -r requirements.txt
make install-frontend  # cd frontend && npm install

# ── Testing ──────────────────────────────────────────────────────
make test              # Run all tests
make test-backend      # pytest with coverage
make test-frontend     # TypeScript type check + ESLint
make test-unit         # Unit tests only
make test-integration  # Integration tests only

# ── Linting & Formatting ─────────────────────────────────────────
make lint              # Lint backend + frontend
make lint-backend      # ruff check + mypy
make lint-frontend     # eslint
make format            # Auto-format Python (ruff)

# ── Docker ───────────────────────────────────────────────────────
make docker-up         # Start all services (detached)
make docker-down       # Stop all services
make docker-build      # Rebuild images
make docker-logs       # Tail all container logs
make docker-reset      # Tear down + delete volumes (DESTRUCTIVE)

# ── Database ─────────────────────────────────────────────────────
make migrate                       # Apply all pending migrations
make migrate-create MSG="add x"    # Create a new migration
make migrate-rollback              # Roll back one migration

# ── Utilities ────────────────────────────────────────────────────
make env               # Create .env from .env.example
make clean             # Remove build caches and artifacts
make setup             # First-time: env + install + migrate
```

### Manual commands (without Make)

```bash
# Backend only
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend only
cd frontend && npm run dev

# Celery worker
celery -A backend.pipeline.job_manager.celery_app worker \
  --loglevel=info --queues=pipeline,analysis --concurrency=2

# Run tests
pytest tests/ -v --cov=backend

# Build frontend
cd frontend && npm run build && npm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM key with Bedrock + Transcribe + S3 access |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_REGION` | e.g. `us-east-1` |
| `BEDROCK_CLAUDE_MODEL_ID` | Claude Sonnet 4.6 cross-region inference profile |
| `S3_BUCKET_NAME` | Bucket for audio + transcripts |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis for Celery broker |
| `JWT_SECRET_KEY` | Long random string (min 32 chars) |

---

## Key Technologies

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand |
| API | FastAPI, Pydantic v2, SQLAlchemy 2 |
| Transcription | Amazon Transcribe (medical specialty, speaker diarization) |
| AI Analysis | Claude Sonnet 4.6 via Amazon Bedrock (streaming) |
| Background Jobs | Celery + Redis |
| Database | PostgreSQL |
| Storage | Amazon S3 (AES-256 encrypted) |
| Auth | JWT (python-jose) |
| Infra | Docker Compose |

---

## HIPAA Notes

- Audio is stored in S3 with AES-256 server-side encryption
- Amazon Transcribe PII redaction is enabled on all jobs
- The `hipaa_sanitizer` module strips PHI from logs before writing
- JWT tokens expire after 60 minutes (configurable)
- All API endpoints require authentication except `/health`

> **This project is a reference implementation. Consult a HIPAA compliance specialist before handling real patient data in production.**

---

## License

MIT
