'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Session } from '@/types/session'
import { Transcript } from '@/types/transcript'
import { Analysis } from '@/types/analysis'
import { api } from '@/lib/api-client'
import { SessionVisitLayout } from '@/components/visit/SessionVisitLayout'
import TranscriptViewer from '@/components/transcript/TranscriptViewer'
import AnalysisPanel from '@/components/analysis/AnalysisPanel'
import MedicationList from '@/components/analysis/MedicationList'
import DiagnosisSummary from '@/components/analysis/DiagnosisSummary'
import SOAPNote from '@/components/analysis/SOAPNote'
import AudioRecorder from '@/components/recorder/AudioRecorder'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

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

  // New session — show recorder; reload once done so we transition to the full layout
  if (session.status === 'idle') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title={session.title} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <AudioRecorder session={session} onComplete={() => load()} />
            </div>
          </main>
        </div>
      </div>
    )
  }

  const hasTreatment =
    analysis &&
    (analysis.medications.length > 0 ||
      !!analysis.patientInstructions ||
      analysis.keyPoints.length > 0)

  return (
    <SessionVisitLayout
      sessionId={id}
      title={session.title}
      subtitle="Clinical documentation"
      transcriptEntryCount={transcript?.segments?.length ?? 0}

      // Default view (Transcript sidebar tab) — full analysis panel
      liveContextContent={
        <AnalysisPanel
          analysis={analysis}
          isStreaming={false}
          streamedText=""
          sessionId={id}
          transcriptId={session.transcriptId}
        />
      }

      // Draft Note tab — SOAP note only
      soapContent={
        analysis?.soapNote ? (
          <SOAPNote soapNote={analysis.soapNote} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            No SOAP note yet — complete a recording first.
          </p>
        )
      }

      // Clinical Fields tab — diagnoses
      diagnosisContent={
        analysis?.diagnoses?.length ? (
          <DiagnosisSummary diagnoses={analysis.diagnoses} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            No diagnoses yet — complete a recording first.
          </p>
        )
      }

      // Referrals tab
      referralsContent={
        analysis?.followUp?.referrals?.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Referrals</h3>
            <ul className="space-y-2">
              {analysis.followUp.referrals.map((r, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">No referrals documented.</p>
        )
      }

      // Visit Summary tab
      summaryContent={
        analysis?.summary ? (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="font-semibold text-blue-800 mb-2">Visit Summary</h3>
            <p className="text-sm text-blue-700 leading-relaxed">{analysis.summary}</p>
            {analysis.followUp && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Follow-up</p>
                <p className="text-sm text-blue-700">{analysis.followUp.timeframe} — {analysis.followUp.instructions}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            No summary yet — complete a recording first.
          </p>
        )
      }

      // Treatment Plan section
      treatmentContent={
        hasTreatment ? (
          <div className="space-y-4">
            {analysis!.medications.length > 0 && (
              <MedicationList medications={analysis!.medications} />
            )}
            {analysis!.patientInstructions && (
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                  Patient Instructions
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {analysis!.patientInstructions}
                </p>
              </div>
            )}
            {analysis!.keyPoints.length > 0 && (
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Key Points
                </h4>
                <ul className="space-y-1.5">
                  {analysis!.keyPoints.map((point, i) => (
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

      // Right panel — transcript
      transcriptContent={
        <div className="h-full overflow-y-auto p-4">
          <TranscriptViewer transcript={transcript} isLoading={false} />
        </div>
      }
    />
  )
}
