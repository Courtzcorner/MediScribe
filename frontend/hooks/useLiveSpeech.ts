'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface SpeechEntry {
  id: string
  speaker: 'doctor' | 'patient' | 'unknown'
  text: string
  timestamp: number
}

export interface UseLiveSpeechReturn {
  entries: SpeechEntry[]
  fullText: string
  isListening: boolean
  isSupported: boolean
  start: () => void
  stop: () => void
  reset: () => void
}

// Web Speech API types (not in all TS lib versions)
type SpeechRecognitionAny = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: any) => void) | null
  onend: (() => void) | null
  onerror: ((event: any) => void) | null
  start: () => void
  stop: () => void
}

export function useLiveSpeech(): UseLiveSpeechReturn {
  const [entries, setEntries] = useState<SpeechEntry[]>([])
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionAny | null>(null)
  const lastGeneratedTextRef = useRef<string>('')

  const isSupported = typeof window !== 'undefined' &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    )

  const buildEntry = (text: string): SpeechEntry => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    speaker: 'unknown',
    text: text.trim(),
    timestamp: Date.now(),
  })

  const start = useCallback(() => {
    if (!isSupported) return
    const Ctor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    const recognition: SpeechRecognitionAny = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          const text = (result[0].transcript as string).trim()
          if (text) {
            setEntries((prev) => [...prev, buildEntry(text)])
          }
        }
      }
    }

    recognition.onend = () => {
      // Auto-restart while we're still supposed to be listening
      if (recognitionRef.current === recognition) {
        try { recognition.start() } catch { /* already started */ }
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'aborted') {
        setIsListening(false)
        recognitionRef.current = null
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isSupported])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const r = recognitionRef.current
      recognitionRef.current = null  // prevent auto-restart in onend
      r.stop()
    }
    setIsListening(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setEntries([])
    lastGeneratedTextRef.current = ''
  }, [stop])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        const r = recognitionRef.current
        recognitionRef.current = null
        r.stop()
      }
    }
  }, [])

  const fullText = entries.map((e) => e.text).join(' ')

  return { entries, fullText, isListening, isSupported, start, stop, reset }
}
