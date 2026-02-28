'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, ArrowLeft, User, ClipboardList, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { Session } from '@/types/session'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

const VISIT_TYPES = [
  'Initial Consultation',
  'Follow-up Visit',
  'Annual Check-up',
  'Urgent Care',
  'Specialist Referral',
  'Pre-operative Assessment',
  'Post-operative Follow-up',
  'Telehealth Visit',
]

export default function NewSessionPage() {
  const router = useRouter()

  const [visitType, setVisitType] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const isValid = visitType && patientName.trim()

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setCreating(true)
    setError('')

    const title = `${visitType} — ${patientName.trim()}`
    const combinedNotes = [
      chiefComplaint.trim() ? `Chief Complaint: ${chiefComplaint.trim()}` : '',
      notes.trim() ? `Notes: ${notes.trim()}` : '',
    ].filter(Boolean).join('\n')

    try {
      const created = await api.post<Session>('/sessions', {
        title,
        patient_id: patientId.trim() || undefined,
        notes: combinedNotes || undefined,
      })
      router.push(`/sessions/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      setCreating(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="New Session" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/sessions"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to dashboard
            </Link>

            <form onSubmit={createSession} className="space-y-4">

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                  {error}
                </div>
              )}

              {/* Visit info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Stethoscope className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">Visit Information</h2>
                    <p className="text-xs text-gray-400">Type of consultation</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Visit type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {VISIT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setVisitType(type)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors ${
                          visitType === type
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patient info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <User className="w-4.5 h-4.5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">Patient Details</h2>
                    <p className="text-xs text-gray-400">Who is this session for</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Patient name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      required
                      placeholder="e.g. Jane Smith"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Patient ID <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="e.g. PT-0042"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical notes */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                    <ClipboardList className="w-4.5 h-4.5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">Clinical Notes</h2>
                    <p className="text-xs text-gray-400">Pre-session context for the AI</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Chief complaint <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Persistent cough for 2 weeks"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Additional notes <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Allergies, current medications, relevant history…"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={creating || !isValid}
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <Mic className="w-4 h-4" />
                {creating ? 'Creating session…' : 'Create & start recording'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
