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
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type SidebarSection =
  | 'transcript'
  | 'clinical-focus'
  | 'clinical-fields'
  | 'draft-note'
  | 'referrals'
  | 'visit-summary'
  | 'ask'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  id: SidebarSection
  active?: boolean
  onSelect: (id: SidebarSection) => void
}

function NavItem({ icon, label, id, active, onSelect }: NavItemProps) {
  return (
    <button
      onClick={() => onSelect(id)}
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
  activeSection: SidebarSection
  onSectionChange: (section: SidebarSection) => void
}

export function VisitSidebar({ activeSection, onSectionChange }: VisitSidebarProps) {
  return (
    <aside className="w-60 border-r border-border bg-card flex flex-col h-full flex-shrink-0">
      <nav className="flex-1 py-4">
        <NavItem icon={<FileText />} label="Transcript" id="transcript" active={activeSection === 'transcript'} onSelect={onSectionChange} />
        <NavItem icon={<Focus />} label="Clinical Focus" id="clinical-focus" active={activeSection === 'clinical-focus'} onSelect={onSectionChange} />
        <NavItem icon={<ClipboardList />} label="Clinical Fields" id="clinical-fields" active={activeSection === 'clinical-fields'} onSelect={onSectionChange} />
        <NavItem icon={<FileEdit />} label="Draft Note" id="draft-note" active={activeSection === 'draft-note'} onSelect={onSectionChange} />
        <NavItem icon={<Users />} label="Referrals" id="referrals" active={activeSection === 'referrals'} onSelect={onSectionChange} />
        <NavItem icon={<FileCheck />} label="Visit Summary" id="visit-summary" active={activeSection === 'visit-summary'} onSelect={onSectionChange} />
        <NavItem icon={<MessageSquare />} label="Ask" id="ask" active={activeSection === 'ask'} onSelect={onSectionChange} />
      </nav>

      <div className="border-t border-border py-4">
        <NavItem icon={<CreditCard />} label="Checkout" id="transcript" active={false} onSelect={onSectionChange} />
        <Link
          href="/sessions"
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-5 flex-shrink-0" />
          <span className="text-sm font-medium">Exit Encounter</span>
        </Link>
      </div>
    </aside>
  )
}
