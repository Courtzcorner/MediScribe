'use client'

import { Activity, Sparkles, Stethoscope, FileText } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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
  children?: React.ReactNode
}

export function LiveContext({ children }: LiveContextProps) {
  const [activeTab, setActiveTab] = useState<LiveContextTab>('questions')

  return (
    <div className="rounded-xl border border-border bg-card p-6 min-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="size-5" />
          <h2 className="font-semibold uppercase text-sm tracking-wide">Live Context</h2>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all">
          <Sparkles className="size-4" />
          Generate Questions
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

      {children ?? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-full flex items-center justify-center mb-4 bg-muted">
            <Sparkles className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm max-w-md text-muted-foreground">
            Questions will appear as the conversation progresses. Start recording to get AI-suggested
            questions and identify information gaps.
          </p>
        </div>
      )}
    </div>
  )
}
