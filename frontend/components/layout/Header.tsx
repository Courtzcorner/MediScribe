'use client'

import { Menu, Bell } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const { toggleSidebar } = useUIStore()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
          D
        </div>
      </div>
    </header>
  )
}
