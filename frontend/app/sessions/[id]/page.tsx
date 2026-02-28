'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Session } from '@/types/session'
import { Transcript } from '@/types/transcript'
import { Analysis } from '@/types/analysis'
import { Patient } from '@/types/patient'
import { api } from '@/lib/api-client'
import { useRecorder } from '@/hooks/useRecorder'
import { useLiveSpeech } from '@/hooks/useLiveSpeech'
import { useAnalysis } from '@/hooks/useAnalysis'
import { SessionVisitLayout } from '@/components/visit/SessionVisitLayout'
import type { VisitTab } from '@/components/visit/VisitTabs'
import TranscriptViewer from '@/components/transcript/TranscriptViewer'
import AnalysisPanel from '@/components/analysis/AnalysisPanel'
import MedicationList from '@/components/analysis/MedicationList'

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [notes, setNotes] = useState('')

  // Tab state — default to previsit
  const [activeTab, setActiveTab] = useState<VisitTab>('previsit')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [visitType, setVisitType] = useState('ROUTINE')

  const recorder = useRecorder()
  const liveSpeech = useLiveSpeech()
  const analysisHook = useAnalysis()

  // Flag: waiting for audioBlob after stopping
  const pendingProcessRef = useRef(false)
  const sessionIdRef = useRef(id)
  sessionIdRef.current = id

  const postVisitEnabled = session?.status === 'completed' || !!analysis

  const load = async () => {
    try {
      const s = await api.get<Session>(`/sessions/${id}`)
      setSession(s)
      if (s.transcriptId) {
        const t = await api.get<Transcript>(`/transcribe/${id}`).catch(() => null)
        setTranscript(t)
      }
      if (s.analysisId) {
        const a = await api.get<Analysis>(`/analyze/${id}`).catch(() => null)
        setAnalysis(a)
      }
      if (s.patientId) {
        const p = await api.get<Patient>(`/patients/${s.patientId}`).catch(() => null)
        setPatient(p)
      }
      setNotes(s.notes || '')
      if (s.status === 'completed') {
        setActiveTab('postvisit')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  // Watch for audioBlob becoming available after stopping
  useEffect(() => {
    if (!pendingProcessRef.current || !recorder.audioBlob) return
    pendingProcessRef.current = false

    const processRecording = async (blob: Blob) => {
      setProcessingError(null)
      try {
        const form = new FormData()
        form.append('audio', blob, `session-${sessionIdRef.current}.webm`)
        form.append('sessionId', sessionIdRef.current)
        const t = await api.upload<Transcript>(`/transcribe/${sessionIdRef.current}`, form)
        setTranscript(t)

        await analysisHook.startAnalysis(sessionIdRef.current, t.id)
        const a = await api.get<Analysis>(`/analyze/${sessionIdRef.current}`).catch(() => null)
        setAnalysis(a)
        setActiveTab('postvisit')
      } catch (err) {
        setProcessingError(err instanceof Error ? err.message : 'Processing failed')
      } finally {
        setIsProcessing(false)
      }
    }

    processRecording(recorder.audioBlob)
  }, [recorder.audioBlob])

  const handleStartEncounter = useCallback(async () => {
    setActiveTab('during')
    await recorder.startRecording()
    liveSpeech.start()
  }, [recorder, liveSpeech])

  const handleEndEncounter = useCallback(() => {
    recorder.stopRecording()
    liveSpeech.stop()
    setIsProcessing(true)
    pendingProcessRef.current = true
  }, [recorder, liveSpeech])

  const handleSaveNotes = useCallback(async (newNotes: string) => {
    try {
      await api.patch(`/sessions/${id}`, { notes: newNotes })
      setNotes(newNotes)
      // Also update session object to keep them in sync
      setSession(prev => prev ? { ...prev, notes: newNotes } : null)
    } catch (err) {
      console.error('Failed to save notes:', err)
      throw err
    }
  }, [id])

  const handleCompleteVisit = useCallback(async () => {
    try {
      await api.patch(`/sessions/${id}`, { status: 'completed' })
      setSession(prev => prev ? { ...prev, status: 'completed' } : null)
      // Success feedback could be added here
    } catch (err) {
      console.error('Failed to complete visit:', err)
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex h-screen bg-background items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Session not found</p>
        <Link href="/sessions" className="text-primary hover:underline text-sm">
          Back to sessions
        </Link>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="flex h-screen bg-background items-center justify-center flex-col gap-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <p className="font-semibold text-foreground">Processing encounter…</p>
        <p className="text-sm text-muted-foreground">Transcribing and generating clinical notes</p>
      </div>
    )
  }

  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : session.title

  const hasTreatmentContent =
    analysis &&
    (analysis.medications.length > 0 ||
      analysis.patientInstructions ||
      analysis.keyPoints.length > 0)

  return (
    <>
      {processingError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {processingError}
        </div>
      )}
      <SessionVisitLayout
        sessionId={id}
        transcriptId={session.transcriptId}
        analysis={analysis}
        title={patientName}
        subtitle={chiefComplaint || 'New symptom evaluation'}

        patient={patient}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        postVisitEnabled={postVisitEnabled}
        chiefComplaint={chiefComplaint}
        onChiefComplaintChange={setChiefComplaint}
        visitType={visitType}
        onVisitTypeChange={setVisitType}

        recorderState={recorder.state}
        recordingDuration={recorder.formattedDuration}
        onStartEncounter={handleStartEncounter}
        onEndEncounter={handleEndEncounter}
        notes={notes}
        onSaveNotes={handleSaveNotes}
        onCompleteVisit={handleCompleteVisit}

        liveEntries={liveSpeech.entries}
        liveText={liveSpeech.fullText}

        transcriptEntryCount={
          liveSpeech.entries.length > 0
            ? liveSpeech.entries.length
            : transcript?.segments?.length ?? 0
        }
        transcriptContent={
          transcript ? (
            <div className="h-full overflow-y-auto p-4">
              <TranscriptViewer transcript={transcript} isLoading={false} />
            </div>
          ) : undefined
        }
        liveContextContent={
          <AnalysisPanel
            analysis={analysis}
            isStreaming={false}
            streamedText=""
            sessionId={id}
            transcriptId={session.transcriptId}
          />
        }
        treatmentContent={
          hasTreatmentContent ? (
            <div className="space-y-4">
              {analysis?.medications && analysis.medications.length > 0 && (
                <MedicationList medications={analysis.medications} />
              )}
              {analysis?.patientInstructions && (
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                    Patient Instructions
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {analysis.patientInstructions}
                  </p>
                </div>
              )}
              {analysis?.keyPoints && analysis.keyPoints.length > 0 && (
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    Key Points
                  </h4>
                  <ul className="space-y-1.5">
                    {analysis.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : undefined
        }
      />
    </>
  )
}
