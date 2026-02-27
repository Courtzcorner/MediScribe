# MediScribe MVP Plan — Transcription & Analysis First

**Goal:** Get transcription and AI analysis working end-to-end. Defer login and HIPAA compliance until core features are validated.

---

## Current State

| Component | Status | Auth Required? |
|-----------|--------|----------------|
| **Transcription** | Implemented (Nova/Amazon Transcribe) | Yes |
| **Analysis** | Implemented (Claude via Bedrock) | Yes |
| **Sessions** | Implemented (PostgreSQL) | Yes |
| **Frontend flow** | Record → Create session → Transcribe → Analyze | Yes (JWT) |
| **Login/Register** | Implemented | N/A |
| **HIPAA sanitizer** | Implemented (logs) | N/A |

**Blockers:** All API routes require JWT. Sessions require `doctor_id`. No way to try the product without registering.

---

## MVP Scope

### In scope
1. **Record audio** — Browser microphone → upload
2. **Transcribe** — Amazon Transcribe Nova
3. **Analyze** — Claude generates SOAP notes, medications, diagnoses
4. **View results** — Transcript + structured clinical notes on screen
5. **Session storage** — In-memory or SQLite (no PostgreSQL required for MVP)

### Out of scope (defer)
1. **Login/Register** — Skip entirely; anonymous single-user mode
2. **HIPAA compliance** — No sanitizer, no audit logs, no PHI redaction
3. **Multi-user / doctor_id** — Single implicit user
4. **Celery background jobs** — Use synchronous pipeline (simpler)
5. **S3** — Optional: use local file storage or temp files for MVP

---

## Implementation Plan

### Phase 1: Bypass Auth (Backend)

**1.1 Make core routes public**
- Add `/transcribe`, `/analyze`, `/sessions` to `PUBLIC_PATHS` in `api/middleware/auth.py`, **OR**
- Create new unauth routes: `/mvp/transcribe`, `/mvp/analyze`, `/mvp/sessions` that don’t use `get_current_user`

**1.2 Sessions without doctor_id**
- Allow `doctor_id` to be a placeholder (e.g. `"mvp-user"`) for anonymous use
- `CreateSessionRequest`: make `doctor_id` optional; default to `"mvp-user"`
- Sessions route: create sessions without requiring a real user

**Files to change:**
- `api/middleware/auth.py` — expand `PUBLIC_PATHS` or add route-specific skip
- `api/routes/sessions.py` — use default `doctor_id` when no auth
- `api/routes/transcribe.py` — remove `current_user` check or allow mvp-user
- `api/routes/analyze.py` — same as transcribe

---

### Phase 2: Fix Analysis Flow (Backend Bug)

**2.1 Add `get_transcript` to DBHandler**
- `DBHandler` has `save_transcript` but no `get_transcript`
- Analyze route passes empty `transcript.segments` → Claude gets no text
- Add `get_transcript(transcript_id: str) -> Transcript` and use it in analyze route

**Files to change:**
- `backend/storage/db_handler.py` — add `get_transcript`
- `api/routes/analyze.py` — fetch transcript from DB before calling `stream_analysis`

---

### Phase 3: Simplify Infrastructure for MVP

**3.1 Database**
- Option A: Keep PostgreSQL (docker-compose) — minimal change
- Option B: Use SQLite for dev — set `DATABASE_URL=sqlite:///./mediscribe.db` in `.env`

**3.2 Storage**
- Keep S3 (required by Amazon Transcribe for input URI) — no change
- Or: Use Transcribe streaming / local file if your setup supports it

**3.3 Skip Celery**
- Transcribe route already uses sync `orchestrator.process_recording()` — good
- Remove or ignore Celery worker in `docker-compose` for MVP
- Ensure transcribe + analyze run in one request (or frontend polls/wait)

---

### Phase 4: Frontend — Direct Access Without Login

**4.1 Landing page**
- “Try it now” → `/sessions/new` (no login)
- Remove or soften “Sign in” / “Get started free” as primary CTA

**4.2 Sessions without token**
- `api-client` sends requests without `Authorization` when no token
- Backend must accept these (Phase 1)
- Store sessions in backend under `doctor_id="mvp-user"`; no per-user isolation yet

**4.3 Optional: MVP-only layout**
- Add `/try` or `/demo` that skips auth and goes straight to record
- Reuse `AudioRecorder` and `AnalysisPanel` as-is

**Files to change:**
- `frontend/app/page.tsx` — CTA to `/sessions/new` or `/try`
- `frontend/lib/api-client.ts` — already works without token; ensure error handling is clear
- Optional: new `/try` page that creates a temp session and records

---

### Phase 5: Remove HIPAA from MVP Path

**5.1 Don’t call sanitizer**
- `hipaa_sanitizer` is used in logger/utils — leave it but it won’t affect MVP flow
- Or: add a feature flag `ENABLE_HIPAA_SANITIZER=false` for MVP

**5.2 Messaging**
- Remove or downplay “HIPAA Compliant” from landing page features for MVP
- Add disclaimer: “MVP — not for production use with real patient data”

---

## Recommended Order of Work

| Step | Task | Effort |
|------|------|--------|
| 1 | Add `DBHandler.get_transcript()` and fix analyze route | Small |
| 2 | Bypass auth for `/sessions`, `/transcribe`, `/analyze` | Small |
| 3 | Default `doctor_id` to `"mvp-user"` when no token | Small |
| 4 | Update landing page CTA to “Try it now” → `/sessions/new` | Tiny |
| 5 | Test full flow: Record → Transcribe → Analyze → View | Manual |
| 6 | (Optional) SQLite for local dev without Docker | Medium |
| 7 | (Optional) Soften/remove HIPAA messaging on homepage | Tiny |

---

## Minimal `.env` for MVP

```env
# Required
DATABASE_URL=postgresql://mediscribe:password@localhost:5432/mediscribe
# Or SQLite: sqlite:///./mediscribe.db

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
BEDROCK_CLAUDE_MODEL_ID=...   # or BEDROCK_CLAUDE_MODEL_ID

# Optional for MVP
JWT_SECRET_KEY=any-random-string   # Not used if auth bypassed
REDIS_URL=redis://localhost:6379/0   # Not needed if Celery skipped
```

---

## Definition of Done (MVP)

- [ ] User can open app, go to “New Session”, enter title
- [ ] User can record audio in browser
- [ ] Audio is uploaded and transcribed (Amazon Transcribe)
- [ ] Claude analysis runs and returns SOAP notes
- [ ] User sees transcript + structured notes (medications, diagnoses, etc.) on the session page
- [ ] No login required
- [ ] Works with `docker-compose up` or equivalent (Postgres + Redis optional if Celery skipped)

---

## Post-MVP (When Core Works)

1. Re-enable auth and real `doctor_id`
2. Add HIPAA sanitizer and audit logging
3. Reintroduce Celery for long-running jobs
4. Add user registration and session isolation
