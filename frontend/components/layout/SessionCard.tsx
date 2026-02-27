import Link from 'next/link'
import { Clock, CheckCircle, AlertCircle, Loader2, Mic } from 'lucide-react'
import { Session, SessionStatus } from '@/types/session'
import { formatDuration } from '@/lib/audio-utils'
import { clsx } from 'clsx'

interface SessionCardProps {
  session: Session
}

const statusConfig: Record<SessionStatus, { icon: React.ElementType; label: string; class: string }> = {
  idle: { icon: Mic, label: 'Idle', class: 'text-gray-500 bg-gray-100' },
  recording: { icon: Mic, label: 'Recording', class: 'text-red-600 bg-red-50' },
  processing: { icon: Loader2, label: 'Processing', class: 'text-yellow-600 bg-yellow-50' },
  completed: { icon: CheckCircle, label: 'Completed', class: 'text-green-600 bg-green-50' },
  failed: { icon: AlertCircle, label: 'Failed', class: 'text-red-600 bg-red-50' },
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
      className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
          {session.patientId && (
            <p className="text-sm text-gray-400 mt-0.5">Patient: {session.patientId}</p>
          )}
        </div>
        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0', config.class)}>
          <Icon className={clsx('w-3 h-3', session.status === 'processing' && 'animate-spin')} />
          {config.label}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span>{date} at {time}</span>
        {session.duration > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(session.duration)}
          </span>
        )}
      </div>
    </Link>
  )
}
