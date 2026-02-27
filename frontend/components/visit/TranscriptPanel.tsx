'use client'

import { AlignLeft, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TranscriptPanelProps {
  children?: React.ReactNode
  entryCount?: number
  isReady?: boolean
}

export function TranscriptPanel({
  children,
  entryCount = 0,
  isReady = true,
}: TranscriptPanelProps) {
  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col h-full flex-shrink-0">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlignLeft className="size-5" />
          <h3 className="font-semibold uppercase text-sm tracking-wide">Live Transcript</h3>
          <span className="ml-auto text-xs text-muted-foreground">{entryCount} entries</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {children ?? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="size-16 rounded-full flex items-center justify-center mb-4 bg-purple-500/10">
              <Mic className="size-8 text-purple-500 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold mb-2 text-foreground">No Transcript Yet</h4>
            <p className="text-sm text-muted-foreground">
              Transcript will appear here once recording starts.
            </p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-border">
        <button
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
            isReady
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          <div className="size-2 rounded-full bg-white animate-pulse" />
          Ready
        </button>
      </div>
    </aside>
  )
}
