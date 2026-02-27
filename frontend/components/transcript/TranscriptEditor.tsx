'use client'

import { useState } from 'react'
import { Transcript, TranscriptSegment, SpeakerRole } from '@/types/transcript'
import { useTranscript } from '@/hooks/useTranscript'
import { Check, X, Edit2 } from 'lucide-react'
import SpeakerLabel from './SpeakerLabel'
import { clsx } from 'clsx'

interface TranscriptEditorProps {
  transcript: Transcript
  onSave?: (transcript: Transcript) => void
}

export default function TranscriptEditor({ transcript, onSave }: TranscriptEditorProps) {
  const { updateSegment } = useTranscript()
  const [editing, setEditing] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const startEdit = (segment: TranscriptSegment) => {
    setEditing(segment.id)
    setEditText(segment.text)
  }

  const saveEdit = (id: string) => {
    updateSegment(id, editText)
    setEditing(null)
  }

  const cancelEdit = () => setEditing(null)

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {transcript.segments.map((segment) => (
        <div key={segment.id} className="flex gap-3 group">
          <SpeakerLabel speaker={segment.speaker} />
          <div className="flex-1">
            {editing === segment.id ? (
              <div className="bg-white rounded-xl border-2 border-blue-300 shadow-sm p-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full text-sm text-gray-700 resize-none focus:outline-none leading-relaxed min-h-[60px]"
                  autoFocus
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => saveEdit(segment.id)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <p className="text-sm text-gray-700 leading-relaxed bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm pr-10">
                  {segment.text}
                </p>
                <button
                  onClick={() => startEdit(segment)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
