'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Session } from '@/types/session'
import { api } from '@/lib/api-client'
import SessionCard from '@/components/layout/SessionCard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get<Session[]>('/sessions/')
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Sessions" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sessions…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Session list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-4">No sessions found</p>
                <Link
                  href="/sessions/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Start your first session
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
