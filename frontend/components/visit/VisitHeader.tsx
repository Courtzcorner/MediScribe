'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, Moon, Sun, Square } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface VisitHeaderProps {
  title?: string
  subtitle?: string
  visitType?: string
  onVisitTypeChange?: (v: string) => void
  isRecording?: boolean
  onEndEncounter?: () => void
  recordingDuration?: string
}

export function VisitHeader({
  title = 'Patient',
  subtitle = 'New symptom evaluation',
  visitType = 'ROUTINE',
  onVisitTypeChange,
  isRecording = false,
  onEndEncounter,
  recordingDuration,
}: VisitHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const darkMode = resolvedTheme === 'dark'

  return (
    <header className="border-b border-border bg-background px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/sessions"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <span className="font-medium text-muted-foreground">Dashboard</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="size-4" />
            <span className="text-sm">MediScribe</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(darkMode ? 'light' : 'dark')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
              'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
          <div className="text-right">
            <select
              value={visitType}
              onChange={(e) => onVisitTypeChange?.(e.target.value)}
              className={cn(
                'text-sm border border-border rounded-lg px-3 py-1.5 bg-background',
                'text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            >
              <option>ROUTINE</option>
              <option>URGENT</option>
              <option>FOLLOW-UP</option>
              <option>NEW_PATIENT</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {isRecording && recordingDuration && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              {recordingDuration}
            </div>
          )}
          {isRecording && onEndEncounter && (
            <button
              onClick={onEndEncounter}
              className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
            >
              <Square className="size-3.5 fill-white" />
              End Encounter
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
