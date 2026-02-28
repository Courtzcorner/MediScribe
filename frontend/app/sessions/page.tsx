'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Mic, CheckCircle, Loader2, Calendar, Clock, FileText } from 'lucide-react'
import { Session } from '@/types/session'
import { api } from '@/lib/api-client'
import SessionCard from '@/components/layout/SessionCard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get<Session[]>('/sessions')
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.patientId ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date().toDateString()
  const stats = {
    total: sessions.length,
    completed: sessions.filter((s) => s.status === 'completed').length,
    inProgress: sessions.filter((s) => s.status === 'recording' || s.status === 'processing').length,
    today: sessions.filter((s) => new Date(s.createdAt).toDateString() === today).length,
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Dashboard" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Sessions" value={stats.total} icon={FileText} color="bg-blue-50 text-blue-600" />
              <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="bg-green-50 text-green-600" />
              <StatCard label="In Progress" value={stats.inProgress} icon={Loader2} color="bg-yellow-50 text-yellow-600" />
              <StatCard label="Today" value={stats.today} icon={Calendar} color="bg-purple-50 text-purple-600" />
            </div>

            {/* Sessions list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or patient ID…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  />
                </div>
                <Link
                  href="/sessions/new"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  New session
                </Link>
              </div>

              {/* List */}
              <div className="p-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-7 h-7 text-blue-400" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-1">
                      {search ? 'No sessions match your search' : 'No sessions yet'}
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                      {search ? 'Try a different search term.' : 'Start your first recording session to get going.'}
                    </p>
                    {!search && (
                      <Link
                        href="/sessions/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Start first session
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                    <p className="text-xs text-gray-400 text-center pt-2">
                      {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                      {search && ` matching "${search}"`}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
