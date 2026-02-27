'use client'

import { Mic, Square, Pause, Play } from 'lucide-react'
import { RecorderState } from '@/hooks/useRecorder'
import { clsx } from 'clsx'

interface RecordingControlsProps {
  state: RecorderState
  duration: string
  onStart: () => Promise<void>
  onStop: () => void
  onPause: () => void
  onResume: () => void
  disabled?: boolean
}

export default function RecordingControls({
  state, duration, onStart, onStop, onPause, onResume, disabled,
}: RecordingControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Duration */}
      <div className="font-mono text-3xl font-bold text-gray-900 tabular-nums">
        {duration}
      </div>

      {/* Main action */}
      <div className="flex items-center gap-4">
        {state === 'idle' || state === 'stopped' ? (
          <button
            onClick={onStart}
            disabled={disabled}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Start recording"
          >
            <Mic className="w-8 h-8" />
          </button>
        ) : (
          <>
            {/* Pause / Resume */}
            <button
              onClick={state === 'recording' ? onPause : onResume}
              disabled={disabled}
              className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all disabled:opacity-50"
              aria-label={state === 'recording' ? 'Pause' : 'Resume'}
            >
              {state === 'recording' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* Pulsing indicator */}
            <div className="relative">
              <div className={clsx(
                'w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200',
                state === 'recording' && 'animate-pulse'
              )}>
                <Mic className="w-8 h-8" />
              </div>
              {state === 'recording' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 border-2 border-white animate-ping" />
              )}
            </div>

            {/* Stop */}
            <button
              onClick={onStop}
              disabled={disabled}
              className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-900 text-white flex items-center justify-center transition-all disabled:opacity-50"
              aria-label="Stop recording"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {state === 'idle' && 'Click to start recording'}
        {state === 'recording' && 'Recording in progress…'}
        {state === 'paused' && 'Recording paused'}
        {state === 'stopped' && 'Recording complete'}
      </p>
    </div>
  )
}
