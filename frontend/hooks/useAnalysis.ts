'use client'

import { useState, useCallback, useRef } from 'react'
import { Analysis } from '@/types/analysis'
import { streamAnalysis } from '@/lib/streaming'

export interface UseAnalysisReturn {
  analysis: Analysis | null
  isAnalyzing: boolean
  streamedText: string
  error: string | null
  startAnalysis: (sessionId: string, transcriptId: string) => Promise<void>
  clearAnalysis: () => void
}

export function useAnalysis(): UseAnalysisReturn {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const startAnalysis = useCallback(async (sessionId: string, transcriptId: string) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsAnalyzing(true)
    setStreamedText('')
    setError(null)
    setAnalysis(null)

    try {
      await streamAnalysis(
        sessionId,
        transcriptId,
        (chunk) => setStreamedText((prev) => prev + chunk),
        (result) => {
          setAnalysis(result)
          setIsAnalyzing(false)
        },
        abortRef.current.signal,
      )
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setIsAnalyzing(false)
    }
  }, [])

  const clearAnalysis = useCallback(() => {
    abortRef.current?.abort()
    setAnalysis(null)
    setStreamedText('')
    setError(null)
    setIsAnalyzing(false)
  }, [])

  return { analysis, isAnalyzing, streamedText, error, startAnalysis, clearAnalysis }
}
