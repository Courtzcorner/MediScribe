export type SessionStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'failed'

export interface Session {
  id: string
  title: string
  patientId?: string
  doctorId: string
  status: SessionStatus
  duration: number        // seconds
  createdAt: string       // ISO 8601
  updatedAt: string
  audioUrl?: string
  transcriptId?: string
  analysisId?: string
  notes?: string
}

export interface CreateSessionPayload {
  title: string
  patientId?: string
  notes?: string
}

export interface UpdateSessionPayload {
  title?: string
  status?: SessionStatus
  notes?: string
  duration?: number
}

export interface SessionsResponse {
  sessions: Session[]
  total: number
  page: number
  pageSize: number
}
