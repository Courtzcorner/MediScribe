'use client'

import { FileText, Activity, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type VisitTab = 'pre-visit' | 'during-visit' | 'post-visit'

interface TabProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

function Tab({ icon, label, active, disabled, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all',
        active
          ? 'border-foreground text-foreground'
          : disabled
          ? 'border-transparent text-muted-foreground cursor-not-allowed'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      <span className="size-4">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

export function VisitTabs() {
  const [activeTab, setActiveTab] = useState<VisitTab>('during-visit')

  return (
    <div className="flex items-center gap-1 border-b border-border bg-background px-6">
      <Tab
        icon={<FileText className="size-4" />}
        label="Pre-Visit"
        active={activeTab === 'pre-visit'}
        onClick={() => setActiveTab('pre-visit')}
      />
      <Tab
        icon={<Activity className="size-4" />}
        label="During Visit"
        active={activeTab === 'during-visit'}
        onClick={() => setActiveTab('during-visit')}
      />
      <Tab
        icon={<CheckCircle className="size-4" />}
        label="Post-Visit"
        active={activeTab === 'post-visit'}
        onClick={() => setActiveTab('post-visit')}
      />
    </div>
  )
}
