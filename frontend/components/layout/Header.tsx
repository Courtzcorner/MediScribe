'use client'

import { Bell, Menu, Search, Sparkles } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const { toggleSidebar } = useUIStore()

  return (
    <header className="sticky top-0 z-20 flex h-20 flex-shrink-0 items-center border-b border-slate-200/80 bg-white/75 px-6 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="inline-flex rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Workspace
            </p>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 lg:flex">
            <Search className="h-4 w-4" />
            <span>Search coming soon</span>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 md:flex">
            <Sparkles className="h-4 w-4" />
            AI ready
          </div>

          <button className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
            <Bell className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 shadow-[0_10px_30px_rgba(148,163,184,0.12)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
              D
            </div>
            <div className="hidden pr-1 md:block">
              <p className="text-sm font-semibold text-slate-900">Dr. Demo</p>
              <p className="text-xs text-slate-500">Clinical account</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
