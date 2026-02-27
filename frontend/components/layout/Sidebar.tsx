'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mic, LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { clsx } from 'clsx'

const navItems = [
  { href: '/sessions', icon: LayoutDashboard, label: 'Sessions' },
  { href: '/sessions/new', icon: Mic, label: 'New Recording' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen } = useUIStore()

  return (
    <aside
      className={clsx(
        'flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-0 overflow-hidden lg:w-16'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200 gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Mic className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-bold text-gray-900 text-lg whitespace-nowrap">MediScribe</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </Link>
        <button
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/login' }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
