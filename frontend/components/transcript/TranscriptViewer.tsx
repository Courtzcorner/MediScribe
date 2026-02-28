'use client'

import { Transcript } from '@/types/transcript'
import { FileText } from 'lucide-react'
import SpeakerLabel from './SpeakerLabel'

interface TranscriptViewerProps {
  transcript: Transcript | null
  isLoading: boolean
}

export default function TranscriptViewer({ transcript, isLoading }: TranscriptViewerProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (!transcript || transcript.segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-gray-300" />
        </div>
        <p className="text-gray-400 font-medium">No transcript yet</p>
        <p className="text-gray-300 text-sm mt-1">Record a consultation to generate a transcript</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">
          {transcript.wordCount != null ? `${transcript.wordCount.toLocaleString()} words · ` : ''}{transcript.segments.length} segments
        </p>
      </div>

      {transcript.segments.map((segment) => (
        <div key={segment.id} className="flex gap-3">
          <SpeakerLabel speaker={segment.speaker} />
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
              {segment.text}
            </p>
            <p className="text-xs text-gray-300 mt-1 pl-1">
              {formatTime(segment.startTime)} — {formatTime(segment.endTime)}
              {segment.confidence < 0.8 && (
                <span className="ml-2 text-yellow-500">Low confidence</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}
