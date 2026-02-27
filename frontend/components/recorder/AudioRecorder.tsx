'use client'

import { useState } from 'react'
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

  const handleStop = async () => {
    recorder.stopRecording()
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{session.title}</h2>
        <p className="text-sm text-gray-400">{stageLabel[stage]}</p>
      </div>

      <WaveformVisualizer isRecording={recorder.state === 'recording'} />

      <div className="flex justify-center mt-8">
        <RecordingControls
          state={recorder.state}
          duration={recorder.formattedDuration}
          onStart={recorder.startRecording}
          onStop={handleStop}
          onPause={recorder.pauseRecording}
          onResume={recorder.resumeRecording}
          disabled={stage !== 'record'}
        />
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
