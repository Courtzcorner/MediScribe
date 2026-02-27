'use client'

import { FileText, Activity, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  disabled?: boolean
}

function Tab({ icon, label, active, disabled }: TabProps) {
  return (
    <button
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all',
        active
          ? 'border-foreground text-foreground'
          : disabled
          ? 'border-transparent text-muted-foreground cursor-not-allowed'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
      disabled={disabled}
    >
      <span className="size-4">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

export function VisitTabs() {
  return (
    <div className="flex items-center gap-1 border-b border-border bg-background px-6">
      <Tab icon={<FileText className="size-4" />} label="Pre-Visit" />
      <Tab icon={<Activity className="size-4" />} label="During Visit" active />
      <Tab icon={<CheckCircle className="size-4" />} label="Post-Visit" disabled />
    </div>
  )
}
