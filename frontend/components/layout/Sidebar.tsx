'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Mic,
  PlusCircle,
  Settings,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { clsx } from 'clsx'

const navItems = [
  {
    href: '/sessions',
    icon: LayoutDashboard,
    label: 'Sessions',
    description: 'Review active and completed visits',
  },
  {
    href: '/sessions/new',
    icon: PlusCircle,
    label: 'New Recording',
    description: 'Open a fresh recording workspace',
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore()

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-sm transition-opacity lg:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-[linear-gradient(180deg,#f9fafb_0%,#f4f7f4_100%)] shadow-[0_24px_90px_rgba(15,23,42,0.16)] transition-all duration-300 lg:static lg:z-auto lg:shadow-none',
          sidebarOpen
            ? 'w-72 translate-x-0'
            : 'w-0 -translate-x-full overflow-hidden lg:w-20 lg:translate-x-0'
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-slate-200/80 px-4 py-4">
            <div
              className={clsx(
                'flex items-center',
                sidebarOpen ? 'justify-between gap-3' : 'justify-center'
              )}
            >
              <Link href="/sessions" className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                  <Mic className="h-5 w-5" />
                </div>
                {sidebarOpen && (
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold tracking-tight text-slate-950">
                      MediScribe
                    </p>
                    <p className="truncate text-sm text-slate-500">Clinical workspace</p>
                  </div>
                )}
              </Link>

              <button
                onClick={toggleSidebar}
                className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 lg:inline-flex"
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-2">
              {sidebarOpen && (
                <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Navigation
                </p>
              )}

              <nav className="space-y-2">
                {navItems.map(({ href, icon: Icon, label, description }) => {
                  const active =
                    href === '/sessions'
                      ? pathname === '/sessions' || pathname.startsWith('/sessions/')
                      : pathname === href

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={clsx(
                        'group flex items-center rounded-2xl transition-all',
                        sidebarOpen
                          ? 'gap-3 px-3 py-3'
                          : 'justify-center px-2 py-3',
                        active
                          ? 'bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.16)]'
                          : 'text-slate-600 hover:bg-white hover:text-slate-950'
                      )}
                      title={!sidebarOpen ? label : undefined}
                    >
                      <div
                        className={clsx(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
                          active
                            ? 'bg-white/10 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-950 group-hover:text-white'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {sidebarOpen && (
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{label}</p>
                          <p
                            className={clsx(
                              'truncate text-xs',
                              active ? 'text-slate-300' : 'text-slate-400'
                            )}
                          >
                            {description}
                          </p>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          <div className="border-t border-slate-200/80 p-3">
            <div className="space-y-2">
              <Link
                href="/settings"
                className={clsx(
                  'group flex items-center rounded-2xl text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950',
                  sidebarOpen ? 'gap-3 px-3 py-3' : 'justify-center px-2 py-3'
                )}
                title={!sidebarOpen ? 'Settings' : undefined}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-950 group-hover:text-white">
                  <Settings className="h-5 w-5" />
                </div>
                {sidebarOpen && (
                  <div>
                    <p className="text-sm font-semibold">Settings</p>
                    <p className="text-xs text-slate-400">Preferences and account</p>
                  </div>
                )}
              </Link>

              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  window.location.href = '/login'
                }}
                className={clsx(
                  'group flex w-full items-center rounded-2xl text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700',
                  sidebarOpen ? 'gap-3 px-3 py-3' : 'justify-center px-2 py-3'
                )}
                title={!sidebarOpen ? 'Sign out' : undefined}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-red-100 group-hover:text-red-700">
                  <LogOut className="h-5 w-5" />
                </div>
                {sidebarOpen && (
                  <div className="text-left">
                    <p className="text-sm font-semibold">Sign out</p>
                    <p className="text-xs text-slate-400">End this session securely</p>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
