'use client'

import { AlignLeft, Mic } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { SpeechEntry } from '@/hooks/useLiveSpeech'

interface TranscriptPanelProps {
  children?: React.ReactNode
  entryCount?: number
  isReady?: boolean
  isRecording?: boolean
  liveEntries?: SpeechEntry[]
}

export function TranscriptPanel({
  children,
  entryCount = 0,
  isReady = true,
  isRecording = false,
  liveEntries = [],
}: TranscriptPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Only auto-scroll if the user is already near the bottom
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 80) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [liveEntries.length])

  const showLive = isRecording && liveEntries.length > 0

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col h-full flex-shrink-0">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlignLeft className="size-5" />
          <h3 className="font-semibold uppercase text-sm tracking-wide">Live Transcript</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            {showLive ? liveEntries.length : entryCount} entries
          </span>
          {isRecording && (
            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {showLive ? (
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {liveEntries.map((entry, i) => (
              <div key={entry.id} className="space-y-1">
                <span className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  i % 2 === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                )}>
                  {i % 2 === 0 ? 'Doctor' : 'Patient'}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{entry.text}</p>
              </div>
            ))}
          </div>
        ) : children ? (
          <div className="flex-1 overflow-hidden">{children}</div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="size-16 rounded-full flex items-center justify-center mb-4 bg-purple-500/10">
              <Mic className="size-8 text-purple-500 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold mb-2 text-foreground">No Transcript Yet</h4>
            <p className="text-sm text-muted-foreground">
              {isRecording
                ? 'Listening… speak clearly near the microphone.'
                : 'Transcript will appear here once recording starts.'}
            </p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-border">
        <div
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
            isRecording
              ? 'bg-red-500 text-white'
              : isReady
              ? 'bg-green-500 text-white'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <div className={cn('size-2 rounded-full', isRecording ? 'bg-white animate-pulse' : 'bg-white')} />
          {isRecording ? 'Recording' : isReady ? 'Ready' : 'Not ready'}
        </div>
      </div>
    </aside>
  )
}
