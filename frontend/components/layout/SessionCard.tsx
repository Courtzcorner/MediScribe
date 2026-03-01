import Link from 'next/link'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Loader2,
  Mic,
  UserRound,
} from 'lucide-react'
import { Session, SessionStatus } from '@/types/session'
import { formatDuration } from '@/lib/audio-utils'
import { clsx } from 'clsx'

interface SessionCardProps {
  session: Session
}

const statusConfig: Record<
  SessionStatus,
  { icon: React.ElementType; label: string; className: string; dotClassName: string }
> = {
  idle: {
    icon: Mic,
    label: 'Idle',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    dotClassName: 'bg-slate-500',
  },
  recording: {
    icon: Mic,
    label: 'Recording',
    className: 'border-red-200 bg-red-50 text-red-700',
    dotClassName: 'bg-red-500',
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClassName: 'bg-rose-500',
  },
}

export default function SessionCard({ session }: SessionCardProps) {
  const config = statusConfig[session.status]
  const Icon = config.icon
  const date = new Date(session.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const time = new Date(session.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="group block overflow-hidden rounded-[28px] border border-slate-200/90 bg-[linear-gradient(135deg,#ffffff_0%,#fbfcfb_100%)] p-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_26px_70px_rgba(148,163,184,0.18)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight text-slate-950">
                {session.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Created {date} at {time}
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 flex-shrink-0 text-slate-300 transition group-hover:text-slate-700" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="flex flex-wrap gap-2">
              <span
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                  config.className
                )}
              >
                <span className={clsx('h-2 w-2 rounded-full', config.dotClassName)} />
                <Icon
                  className={clsx('h-3.5 w-3.5', session.status === 'processing' && 'animate-spin')}
                />
                {config.label}
              </span>

              {session.patientId && (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <UserRound className="h-3.5 w-3.5" />
                  Patient {session.patientId}
                </span>
              )}
            </div>

            {session.duration > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(session.duration)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
