'use client'

import { FileText, Activity, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type VisitTab = 'previsit' | 'during' | 'postvisit'

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

interface VisitTabsProps {
  activeTab: VisitTab
  onTabChange: (tab: VisitTab) => void
  postVisitEnabled?: boolean
}

export function VisitTabs({ activeTab, onTabChange, postVisitEnabled = false }: VisitTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border bg-background px-6">
      <Tab
        icon={<FileText className="size-4" />}
        label="Pre-Visit"
        active={activeTab === 'previsit'}
        onClick={() => onTabChange('previsit')}
      />
      <Tab
        icon={<Activity className="size-4" />}
        label="During Visit"
        active={activeTab === 'during'}
        onClick={() => onTabChange('during')}
      />
      <Tab
        icon={<CheckCircle className="size-4" />}
        label="Post-Visit"
        active={activeTab === 'postvisit'}
        disabled={!postVisitEnabled}
        onClick={postVisitEnabled ? () => onTabChange('postvisit') : undefined}
      />
    </div>
  )
}
