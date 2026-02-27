import { create } from 'zustand'
import { Session } from '@/types/session'
import { Transcript } from '@/types/transcript'
import { Analysis } from '@/types/analysis'

interface SessionState {
  sessions: Session[]
  currentSession: Session | null
  currentTranscript: Transcript | null
  currentAnalysis: Analysis | null
  isLoading: boolean
  error: string | null

  setSessions: (sessions: Session[]) => void
  setCurrentSession: (session: Session | null) => void
  setCurrentTranscript: (transcript: Transcript | null) => void
  setCurrentAnalysis: (analysis: Analysis | null) => void
  updateSessionStatus: (id: string, status: Session['status']) => void
  addSession: (session: Session) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  currentTranscript: null,
  currentAnalysis: null,
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setCurrentTranscript: (transcript) => set({ currentTranscript: transcript }),
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

  updateSessionStatus: (id, status) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, status } : s)),
      currentSession:
        state.currentSession?.id === id
          ? { ...state.currentSession, status }
          : state.currentSession,
    })),

  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  reset: () =>
    set({ currentSession: null, currentTranscript: null, currentAnalysis: null, error: null }),
}))
