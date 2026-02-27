import { Analysis, AnalysisStreamEvent } from '@/types/analysis'

export async function streamAnalysis(
  sessionId: string,
  transcriptId: string,
  onChunk: (chunk: string) => void,
  onComplete: (analysis: Analysis) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ sessionId, transcriptId }),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Analysis failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  if (!res.body) throw new Error('No response body from analysis stream')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data || data === '[DONE]') continue

      try {
        const event: AnalysisStreamEvent = JSON.parse(data)
        if (event.type === 'chunk' && event.content) {
          onChunk(event.content)
        } else if (event.type === 'complete' && event.analysis) {
          onComplete(event.analysis)
        } else if (event.type === 'error') {
          throw new Error(event.error ?? 'Analysis stream error')
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue // malformed SSE line
        throw e
      }
    }
  }
}
