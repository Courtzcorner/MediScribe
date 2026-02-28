'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, Mic, MicOff, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface VisitHeaderProps {
  title?: string
  subtitle?: string
}

export function VisitHeader({ title = 'Laasya', subtitle = 'New symptom evaluation' }: VisitHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [isVoiceActive, setIsVoiceActive] = useState(false)
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
            <span className="text-sm">Echo Health</span>
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
              className={cn(
                'text-sm border border-border rounded-lg px-3 py-1.5 bg-background',
                'text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            >
              <option>ROUTINE</option>
              <option>URGENT</option>
              <option>FOLLOW-UP</option>
            </select>
          </div>
          <button
            className={cn(
              'text-sm border border-border rounded-lg px-4 py-1.5 bg-background',
              'text-muted-foreground hover:bg-muted transition-colors'
            )}
          >
            NEW PATIENT
          </button>
          <div className="text-right">
            <div className="font-medium text-foreground">Intake</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
              isVoiceActive ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            {isVoiceActive ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            Voice
          </button>
          <Link
            href="/sessions"
            className="bg-rose-400 hover:bg-rose-500 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
          >
            <div className="size-5 rounded-full bg-white/30 flex items-center justify-center">
              <div className="size-2 rounded-full bg-white" />
            </div>
            End Encounter
          </Link>
        </div>
      </div>
    </header>
  )
}
