'use client'

import { useState, useRef, useCallback } from 'react'
import { getAudioConstraints, createMediaRecorder, formatDuration } from '@/lib/audio-utils'

export type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped'

export interface UseRecorderReturn {
  state: RecorderState
  audioBlob: Blob | null
  audioUrl: string | null
  duration: number
  formattedDuration: string
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
  error: string | null
}

export function useRecorder(): UseRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints())
      streamRef.current = stream

      const recorder = createMediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
      }

      recorder.onerror = () => {
        setError('Recording error occurred')
        stopTimer()
        setState('stopped')
      }

      recorder.start(1000) // collect in 1-second chunks for streaming
      setState('recording')
      startTimer()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone'
      setError(message)
    }
  }, [startTimer, stopTimer])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    stopTimer()
    setState('stopped')
  }, [stopTimer])

  const pauseRecording = useCallback(() => {
    mediaRecorderRef.current?.pause()
    stopTimer()
    setState('paused')
  }, [stopTimer])

  const resumeRecording = useCallback(() => {
    mediaRecorderRef.current?.resume()
    startTimer()
    setState('recording')
  }, [startTimer])

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    chunksRef.current = []
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setState('idle')
    setError(null)
  }, [audioUrl])

  return {
    state,
    audioBlob,
    audioUrl,
    duration,
    formattedDuration: formatDuration(duration),
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
  }
}
