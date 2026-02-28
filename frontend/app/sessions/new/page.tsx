'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { Session } from '@/types/session'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function NewSessionPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [patientId, setPatientId] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    setError('')
    try {
      const created = await api.post<Session>('/sessions/', {
        title: title.trim(),
        patientId: patientId.trim() || undefined,
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
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sessions
            </Link>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">New Recording Session</h2>
                  <p className="text-sm text-gray-500">Fill in the details then start recording</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={createSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session title <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Follow-up consultation"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient ID <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="e.g. PT-0042"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {creating ? 'Creating…' : 'Create Session'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
