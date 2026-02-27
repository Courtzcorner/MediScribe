Build a full-stack Next.js 14+ application called "MediScribe" using TypeScript, Tailwind CSS, and App Router. This is a HIPAA-conscious medical platform for doctors to use during patient appointments. Design it with a clean, clinical-luxury aesthetic — think deep navy/slate backgrounds with crisp white panels, subtle cyan/teal accents, and a refined sans-serif font like "DM Sans" or "Instrument Sans" paired with "DM Mono" for transcription text. The UI should feel like a premium medical dashboard — authoritative, trustworthy, and focused.

---

## Tech Stack
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui components
- Amazon Nova 2 Sonic (real-time audio/STT)
- Claude API (AI intelligence layer via Amazon Bedrock)
- Amazon S3 (file/chart storage)
- Python FastAPI backend (connect via REST)
- Zustand for client state

---

## Pages & Routes

### 1. `/dashboard` — Doctor Home
- Welcome header with doctor's name and today's date
- Active session card (if a session is running)
- Quick stats: appointments today, patients seen, pending chart notes
- Recent patient list with status indicators (new, returning, pending review)
- "Start New Session" CTA button (prominent)

### 2. `/session/[appointmentId]` — Live Appointment Session (CORE FEATURE)
This is the most important page. Split into a 3-panel layout:

**Left Panel — Patient Info Sidebar:**
- Patient name, DOB, insurance info
- Chief complaint input field
- Vitals quick entry (editable fields: BP, HR, Temp, Weight)
- Load Previous Chart Notes button (triggers S3 fetch or file upload modal for onboarding new patients)

**Center Panel — Live Transcription:**
- Large waveform/audio visualizer at the top showing mic activity (use Web Audio API + canvas or SVG animation)
- Real-time scrolling transcript feed — doctor speech in one color, patient speech in another
- Clearly distinguish speakers with color-coded tags and timestamps
- Transcription text uses monospace font in a chat-like format
- Mic toggle button (start/stop recording) and session timer

**Right Panel — AI Intelligence Feed (powered by Claude):**
- Tabbed interface with 4 tabs:

  **Tab 1: "Suggested Questions"**
  - Dynamically updated list of follow-up questions Claude suggests based on patient's last response
  - Each question has a "Read Aloud" button and a "Log as Asked" button
  - Questions auto-refresh after patient finishes speaking (show a subtle loading shimmer)

  **Tab 2: "Diagnosis Assistant"**
  - Based on the transcript so far, show a ranked list of possible diagnoses (ICD-10 codes included)
  - Each diagnosis has: confidence indicator (low/medium/high badge), brief rationale, and a "Select" button
  - Below diagnoses: "Possible Medications" section — drug name, dosage suggestion, interaction flags
  - Doctor can click to add to the session summary

  **Tab 3: "Treatment Plan"**
  - AI-generated treatment recommendations displayed as a structured checklist
  - Sections: Immediate Actions, Follow-up Care, Lifestyle Recommendations, Referrals
  - Editable fields — doctor can modify any item
  - "Regenerate" button

  **Tab 4: "Session Notes"**
  - Live SOAP note being generated (Subjective, Objective, Assessment, Plan)
  - Auto-updates as the conversation progresses
  - Doctor can manually edit any section inline
  - "Finalize & Save to Chart" button at bottom

### 3. `/patients/[patientId]` — Patient Profile
- Patient header with photo placeholder, demographics, insurance
- Chart Note History: chronological list of past appointments
  - Each entry: date, doctor, chief complaint, diagnosis, expandable SOAP note
  - Visual timeline design on the left side
- "Upload Previous Chart Notes" section — drag-and-drop area for PDF/TXT files from other physicians (uploads to S3, Claude parses and summarizes)
- "Generate Patient Summary" button — exports a clean, professional PDF summary

### 4. `/patients/[patientId]/summary/[appointmentId]` — Patient Download Summary
- A clean, printable/downloadable report page
- Header: clinic name/logo, date, doctor info, patient info
- Sections: Chief Complaint, Diagnoses (with ICD codes), Medications Prescribed, Treatment Plan, Follow-Up Instructions
- Friendly patient-facing language (Claude rephrases clinical terms)
- Large "Download PDF" button (use react-pdf or a print stylesheet)
- QR code option to share securely

### 5. `/patients/new` — New Patient Onboarding
- Multi-step form: Demographics → Insurance → Medical History → Upload Prior Records
- Step 4 is a drag-and-drop zone for uploading prior physician notes (PDF/DOCX)
- After upload: show Claude's parsed summary of the uploaded records with a "Confirm & Save" flow

---

## Global Components

**Navbar (left sidebar, collapsible):**
- MediScribe logo (stylized stethoscope + waveform icon)
- Navigation links with icons: Dashboard, Patients, Sessions, Settings
- Doctor profile at the bottom with role badge

**Session Status Bar (top, only during active session):**
- Live indicator (pulsing red dot), session timer, patient name, quick-action buttons

**Notification System:**
- Toast notifications for: transcription saved, AI suggestion ready, session ended, chart uploaded

---

## Design Specs

**Color Palette:**
- Background: `#0A0F1E` (deep navy)
- Surface: `#111827` (dark slate panels)
- Border: `#1E2A3A`
- Primary Accent: `#06B6D4` (cyan-500)
- Secondary Accent: `#10B981` (emerald for positive/confirmed)
- Warning: `#F59E0B`
- Error: `#EF4444`
- Text Primary: `#F1F5F9`
- Text Muted: `#64748B`

**Typography:**
- Headings: `DM Sans` (700)
- Body: `DM Sans` (400/500)
- Transcription/Code: `DM Mono`
- Import from Google Fonts via next/font

**Micro-interactions:**
- Skeleton loaders for AI tab content while fetching
- Smooth tab transitions (fade + slight translate)
- Pulsing dot animation for live recording state
- Card hover states with subtle border glow

---

## API Routes (Next.js `/app/api/`)

Create these placeholder API routes with typed request/response shapes:

- `POST /api/session/start` — initialize session, return sessionId
- `POST /api/session/transcribe` — receive audio chunk, return transcript segment
- `POST /api/ai/questions` — send transcript context, return suggested questions
- `POST /api/ai/diagnose` — send full transcript, return diagnosis array
- `POST /api/ai/treatment` — send diagnosis + transcript, return treatment plan
- `POST /api/ai/summarize` — send full session, return patient-friendly summary
- `POST /api/charts/upload` — handle S3 upload of prior chart notes
- `GET /api/patients/[id]/history` — return chart note history array
- `POST /api/session/finalize` — save completed session to S3 + DB

All API routes should use typed Zod schemas for validation.

---

## File Structure

Follow this structure:
/app
/dashboard/page.tsx
/session/[appointmentId]/page.tsx
/patients/[patientId]/page.tsx
/patients/new/page.tsx
/api/...
/components
/session/TranscriptFeed.tsx
/session/AudioVisualizer.tsx
/session/AIPanel.tsx
/session/DiagnosisTab.tsx
/session/TreatmentTab.tsx
/session/QuestionsTab.tsx
/patients/ChartHistory.tsx
/patients/UploadRecords.tsx
/ui/ (shadcn components)
/lib
/api.ts (typed fetch wrappers)
/types.ts (all shared TypeScript types)
/s3.ts (S3 upload helpers)
/hooks
/useSession.ts
/useTranscription.ts
/useAISuggestions.ts

---

## TypeScript Types to Define in `/lib/types.ts`

Include types for: Patient, Appointment, TranscriptSegment, Diagnosis, Medication, TreatmentPlan, SOAPNote, ChartNote, AIQuestion, SessionState.

---

Start by scaffolding the full file structure, then implement the `/session/[appointmentId]` page first as it is the core feature. Use placeholder data/mock API responses where backend is not yet connected. Make every component production-quality with proper loading, error, and empty states.