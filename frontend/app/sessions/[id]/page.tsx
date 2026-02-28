'use client'

import { useEffect, useState } from 'react'
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

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
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

  const hasTreatmentContent =
    analysis &&
    (analysis.medications.length > 0 ||
      analysis.patientInstructions ||
      analysis.keyPoints.length > 0)

  return (
    <SessionVisitLayout
      sessionId={id}
      transcriptId={session.transcriptId}
      analysis={analysis}
      title={session.title}
      subtitle="Clinical documentation"
      transcriptEntryCount={transcript?.segments?.length ?? 0}
      transcriptContent={
        <div className="h-full overflow-y-auto p-4">
          <TranscriptViewer transcript={transcript} isLoading={false} />
        </div>
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
  )
}
