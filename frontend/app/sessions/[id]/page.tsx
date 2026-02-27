'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Session } from '@/types/session'
import { Transcript } from '@/types/transcript'
import { Analysis } from '@/types/analysis'
import { api } from '@/lib/api-client'
import { useUIStore } from '@/store/uiStore'
import TranscriptViewer from '@/components/transcript/TranscriptViewer'
import AnalysisPanel from '@/components/analysis/AnalysisPanel'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { activeTab, setActiveTab } = useUIStore()

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

  useEffect(() => { load() }, [id])

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-gray-500">Session not found</p>
          <Link href="/sessions" className="text-blue-600 hover:underline text-sm">
            Back to sessions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={session.title} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white px-6 flex gap-1">
            {(['transcript', 'analysis'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'transcript' ? (
              <TranscriptViewer transcript={transcript} isLoading={false} />
            ) : (
              <AnalysisPanel
                analysis={analysis}
                isStreaming={false}
                streamedText=""
                sessionId={id}
                transcriptId={session.transcriptId}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
