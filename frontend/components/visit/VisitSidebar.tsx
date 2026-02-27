'use client'

import {
  FileText,
  Focus,
  ClipboardList,
  FileEdit,
  Users,
  FileCheck,
  MessageSquare,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: string
}

function NavItem({ icon, label, active }: NavItemProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-all relative',
        active
          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-r-2 border-purple-500 dark:border-purple-400'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <span className="size-5 flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

interface VisitSidebarProps {
  sessionId?: string
}

export function VisitSidebar({ sessionId }: VisitSidebarProps) {
  return (
    <aside className="w-60 border-r border-border bg-card flex flex-col h-full flex-shrink-0">
      <nav className="flex-1 py-4">
        <NavItem icon={<FileText />} label="Transcript" active />
        <NavItem icon={<Focus />} label="Clinical Focus" />
        <NavItem icon={<ClipboardList />} label="Clinical Fields" />
        <NavItem icon={<FileEdit />} label="Draft Note" />
        <NavItem icon={<Users />} label="Referrals" />
        <NavItem icon={<FileCheck />} label="Visit Summary" />
        <NavItem icon={<MessageSquare />} label="Ask" />
      </nav>

      <div className="border-t border-border py-4">
        <NavItem icon={<CreditCard />} label="Checkout" />
        <a
          href="/sessions"
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-5 flex-shrink-0" />
          <span className="text-sm font-medium">Exit Encounter</span>
        </a>
      </div>
    </aside>
  )
}
