'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Clock3,
  FileAudio,
  Plus,
  Search,
} from 'lucide-react'
import { Session } from '@/types/session'
import { api } from '@/lib/api-client'
import { formatDuration } from '@/lib/audio-utils'
import SessionCard from '@/components/layout/SessionCard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

const statusLabels: Record<Session['status'], string> = {
  idle: 'Queued',
  recording: 'Recording',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Needs review',
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api
      .get<Session[]>('/sessions/')
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const deferredSearch = useDeferredValue(search)
  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const filteredSessions = sessions.filter((session) => {
    if (!normalizedSearch) return true

    return [session.title, session.patientId ?? '', statusLabels[session.status]]
      .some((value) => value.toLowerCase().includes(normalizedSearch))
  })

  const completedCount = sessions.filter((session) => session.status === 'completed').length
  const activeCount = sessions.filter((session) =>
    session.status === 'recording' || session.status === 'processing'
  ).length
  const totalMinutes = Math.round(
    sessions.reduce((sum, session) => sum + session.duration, 0) / 60
  )
  const latestSession = sessions
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0]
  const latestLabel = latestSession
    ? new Date(latestSession.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No sessions yet'

  return (
    <div className="flex h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="Sessions" />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-6">
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(245,158,11,0.14),_transparent_20%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_45%,_#eef6f2_100%)] p-6 shadow-[0_28px_80px_rgba(148,163,184,0.14)] lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/sessions/new"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      Start new session
                    </Link>
                    <Link
                      href={latestSession ? `/sessions/${latestSession.id}` : '/sessions/new'}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                    >
                      Open latest
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Activity snapshot
                  </p>
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Activity className="h-4 w-4 text-emerald-300" />
                        Active work
                      </div>
                      <p className="mt-2 text-3xl font-semibold tracking-tight">{activeCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <FileAudio className="h-4 w-4 text-amber-300" />
                        Completed sessions
                      </div>
                      <p className="mt-2 text-3xl font-semibold tracking-tight">{completedCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock3 className="h-4 w-4 text-cyan-300" />
                        Total recorded time
                      </div>
                      <p className="mt-2 text-3xl font-semibold tracking-tight">
                        {formatDuration(totalMinutes * 60)}
                      </p>
                    </div>
                    <p className="text-sm text-slate-400">Latest session: {latestLabel}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-[0_20px_50px_rgba(148,163,184,0.12)]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, patient ID, or status"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-[28px] border border-slate-200 bg-white/90 p-4 text-center shadow-[0_20px_50px_rgba(148,163,184,0.12)]">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-950">{sessions.length}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-950">{filteredSessions.length}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visible</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-950">{activeCount}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              {loading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-[28px] border border-slate-200 bg-white/70"
                    />
                  ))}
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center shadow-[0_20px_50px_rgba(148,163,184,0.1)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <FileAudio className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
                    {sessions.length === 0 ? 'No sessions recorded yet.' : 'No sessions match this search.'}
                  </h3>
                  <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-500">
                    {sessions.length === 0
                      ? 'Start a recording to create your first transcript and generate visit documentation.'
                      : 'Try a different title, patient ID, or clear the current search to view more visits.'}
                  </p>
                  <div className="mt-8 flex justify-center">
                    <Link
                      href="/sessions/new"
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      Start session
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
                        Session list
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                        {filteredSessions.length} session{filteredSessions.length === 1 ? '' : 's'} in view
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredSessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
