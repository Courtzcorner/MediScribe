'use client'

import { Activity, Sparkles, Stethoscope, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api-client'
import type { Analysis, LiveContextData } from '@/types/analysis'

interface TabButtonProps {
  icon: React.ReactNode
  label: string
  active?: boolean
}

function TabButton({ icon, label, active, onClick }: TabButtonProps & { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <span className="size-4">{icon}</span>
      {label}
    </button>
  )
}

type LiveContextTab = 'questions' | 'ddx' | 'notes'

interface LiveContextProps {
  sessionId: string
  transcriptId?: string | null
  analysis?: Analysis | null
  children?: React.ReactNode
}

export function LiveContext({
  sessionId,
  transcriptId,
  analysis,
  children,
}: LiveContextProps) {
  const [activeTab, setActiveTab] = useState<LiveContextTab>('questions')
  const [liveData, setLiveData] = useState<LiveContextData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canGenerate = Boolean(transcriptId && transcriptId.length > 0)

  const handleGenerate = async () => {
    const tid = transcriptId
    if (!tid) return
    setIsGenerating(true)
    setError(null)
    try {
      const data = await api.post<LiveContextData>('/live-context/generate', {
        session_id: sessionId,
        transcript_id: tid,
      })
      setLiveData(data)
      setActiveTab('questions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate live context')
    } finally {
      setIsGenerating(false)
    }
  }

  // Derive content per tab: prefer liveData, fallback to analysis
  const questions = liveData?.questions ?? []
  const ddx = liveData?.ddx ?? analysis?.diagnoses.map((d) => d.condition) ?? []
  const notes = liveData?.notes ?? analysis?.summary ?? ''

  const hasContent = questions.length > 0 || ddx.length > 0 || notes.length > 0
  const showFallback = !hasContent && children

  return (
    <div className="rounded-xl border border-border bg-card p-6 min-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="size-5" />
          <h2 className="font-semibold uppercase text-sm tracking-wide">Live Context</h2>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className={cn(
            'flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium transition-all',
            canGenerate && !isGenerating
              ? 'hover:bg-purple-700'
              : 'opacity-60 cursor-not-allowed'
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate Questions
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <TabButton
          icon={<Sparkles className="size-4" />}
          label="Questions & Info Gaps"
          active={activeTab === 'questions'}
          onClick={() => setActiveTab('questions')}
        />
        <TabButton
          icon={<Stethoscope className="size-4" />}
          label="DDx"
          active={activeTab === 'ddx'}
          onClick={() => setActiveTab('ddx')}
        />
        <TabButton
          icon={<FileText className="size-4" />}
          label="Notes"
          active={activeTab === 'notes'}
          onClick={() => setActiveTab('notes')}
        />
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-500">{error}</p>
      )}

      {showFallback ? (
        children
      ) : hasContent ? (
        <div className="space-y-4">
          {activeTab === 'questions' && (
            <ul className="space-y-2">
              {questions.map((q, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 text-sm"
                >
                  <span className="size-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  {q}
                </li>
              ))}
            </ul>
          )}
          {activeTab === 'ddx' && (
            <ul className="space-y-2">
              {ddx.map((d, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10 text-sm"
                >
                  <span className="size-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          )}
          {activeTab === 'notes' && (
            <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {notes}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-full flex items-center justify-center mb-4 bg-muted">
            <Sparkles className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm max-w-md text-muted-foreground">
            {canGenerate
              ? 'Click "Generate Questions" to get AI-suggested questions, differential diagnosis, and clinical notes based on the transcript.'
              : 'Questions will appear as the conversation progresses. Complete a recording first, then generate AI-suggested questions and identify information gaps.'}
          </p>
        </div>
      )}
    </div>
  )
}
