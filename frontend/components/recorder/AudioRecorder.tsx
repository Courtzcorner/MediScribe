'use client'

import { useState } from 'react'
import { CheckCircle, RotateCcw, Loader2 } from 'lucide-react'
import { useRecorder } from '@/hooks/useRecorder'
import { useAnalysis } from '@/hooks/useAnalysis'
import { Session } from '@/types/session'
import { api } from '@/lib/api-client'
import { Transcript } from '@/types/transcript'
import RecordingControls from './RecordingControls'
import WaveformVisualizer from './WaveformVisualizer'

interface AudioRecorderProps {
  session: Session
  onComplete: (sessionId: string) => void
}

type Stage = 'record' | 'uploading' | 'transcribing' | 'analysing' | 'done'

export default function AudioRecorder({ session, onComplete }: AudioRecorderProps) {
  const recorder = useRecorder()
  const analysis = useAnalysis()
  const [stage, setStage] = useState<Stage>('record')
  const [error, setError] = useState<string | null>(null)

  const stageLabel: Record<Stage, string> = {
    record: 'Ready to record',
    uploading: 'Uploading audio…',
    transcribing: 'Transcribing with AI…',
    analysing: 'Generating clinical notes…',
    done: 'Complete!',
  }

  // Just stops the MediaRecorder — audioBlob is set asynchronously in onstop
  const handleStop = () => {
    recorder.stopRecording()
  }

  // Triggered explicitly by the "Complete Encounter" button once blob is ready
  const handleComplete = async () => {
    if (!recorder.audioBlob) return

    setError(null)
    try {
      // 1. Upload & transcribe
      setStage('uploading')
      const form = new FormData()
      form.append('audio', recorder.audioBlob, `session-${session.id}.webm`)
      form.append('sessionId', session.id)

      setStage('transcribing')
      const transcript = await api.upload<Transcript>(`/transcribe/${session.id}`, form)

      // 2. Analyse
      setStage('analysing')
      await analysis.startAnalysis(session.id, transcript.id)

      setStage('done')
      setTimeout(() => onComplete(session.id), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
      setStage('record')
    }
  }

  const isProcessing = stage !== 'record'
  const isStopped = recorder.state === 'stopped'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{session.title}</h2>
        <p className="text-sm text-gray-400">{stageLabel[stage]}</p>
      </div>

      <WaveformVisualizer isRecording={recorder.state === 'recording'} />

      <div className="flex justify-center mt-8">
        {isProcessing ? (
          /* Processing stages — hide controls, show spinner */
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">{stageLabel[stage]}</p>
          </div>
        ) : isStopped ? (
          /* Stopped — show Complete Encounter card */
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-gray-900 tabular-nums">
                {recorder.formattedDuration}
              </p>
              <p className="text-xs text-gray-400 mt-1">Recording complete</p>
            </div>

            <button
              onClick={handleComplete}
              disabled={!recorder.audioBlob}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recorder.audioBlob ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Complete Encounter &amp; Analyze
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing…
                </>
              )}
            </button>

            <button
              onClick={recorder.resetRecording}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Re-record
            </button>
          </div>
        ) : (
          /* Idle / recording / paused — show normal controls */
          <RecordingControls
            state={recorder.state}
            duration={recorder.formattedDuration}
            onStart={recorder.startRecording}
            onStop={handleStop}
            onPause={recorder.pauseRecording}
            onResume={recorder.resumeRecording}
            disabled={isProcessing}
          />
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
          {error}
        </div>
      )}

      {recorder.error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
          Microphone: {recorder.error}
        </div>
      )}

      {analysis.isAnalyzing && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm text-center">
          Claude is analysing the consultation…
        </div>
      )}
    </div>
  )
}
