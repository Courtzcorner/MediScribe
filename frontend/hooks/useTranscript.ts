'use client'

import { useState, useCallback } from 'react'
import { Transcript, TranscriptSegment, SpeakerRole } from '@/types/transcript'

export interface UseTranscriptReturn {
  transcript: Transcript | null
  isStreaming: boolean
  appendSegment: (segment: TranscriptSegment) => void
  setTranscript: (transcript: Transcript) => void
  updateSegment: (id: string, text: string, speaker?: SpeakerRole) => void
  clearTranscript: () => void
}

export function useTranscript(): UseTranscriptReturn {
  const [transcript, setTranscriptState] = useState<Transcript | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const appendSegment = useCallback((segment: TranscriptSegment) => {
    setIsStreaming(true)
    setTranscriptState((prev) => {
      if (!prev) {
        return {
          id: crypto.randomUUID(),
          sessionId: '',
          segments: [segment],
          rawText: segment.text,
          language: 'en-US',
          wordCount: segment.text.split(' ').length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
      const rawText = prev.rawText + ' ' + segment.text
      return {
        ...prev,
        segments: [...prev.segments, segment],
        rawText,
        wordCount: rawText.split(' ').length,
        updatedAt: new Date().toISOString(),
      }
    })
  }, [])

  const setTranscript = useCallback((t: Transcript) => {
    setTranscriptState(t)
    setIsStreaming(false)
  }, [])

  const updateSegment = useCallback(
    (id: string, text: string, speaker?: SpeakerRole) => {
      setTranscriptState((prev) => {
        if (!prev) return prev
        const segments = prev.segments.map((s) =>
          s.id === id ? { ...s, text, ...(speaker ? { speaker } : {}) } : s
        )
        const rawText = segments.map((s) => s.text).join(' ')
        return {
          ...prev,
          segments,
          rawText,
          wordCount: rawText.split(' ').length,
          updatedAt: new Date().toISOString(),
        }
      })
    },
    []
  )

  const clearTranscript = useCallback(() => {
    setTranscriptState(null)
    setIsStreaming(false)
  }, [])

  return { transcript, isStreaming, appendSegment, setTranscript, updateSegment, clearTranscript }
}
