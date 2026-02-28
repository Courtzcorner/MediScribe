'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface AskPanelProps {
  sessionId: string
  transcriptId?: string | null
}

export function AskPanel({ sessionId, transcriptId }: AskPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const question = input.trim()
    if (!question || isLoading) return

    setInput('')
    setError(null)
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setIsLoading(true)

    try {
      const payload: Record<string, string> = { session_id: sessionId, question }
      if (transcriptId) payload.transcript_id = transcriptId
      const res = await api.post<{ answer: string }>('/live-context/ask', payload)
      setMessages(prev => [...prev, { role: 'assistant', text: res.answer }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col min-h-[500px]">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bot className="size-5" />
          <h2 className="font-semibold uppercase text-sm tracking-wide">Ask AI</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Ask any clinical question — the AI uses this visit&apos;s transcript as context
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[360px] max-h-[500px]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full flex items-center justify-center mb-4 bg-muted">
              <Bot className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ask any clinical question about this visit. The AI will use the transcript as context.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {['What medications were discussed?', 'Summarize the chief complaint', 'What follow-up is needed?'].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="size-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="size-4 text-purple-500" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-muted text-foreground'
              )}
            >
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="size-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="size-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="size-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Bot className="size-4 text-purple-500" />
            </div>
            <div className="bg-muted rounded-xl px-4 py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a clinical question…"
          className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  )
}
