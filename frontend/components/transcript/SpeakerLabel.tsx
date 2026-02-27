import { SpeakerRole } from '@/types/transcript'
import { clsx } from 'clsx'

interface SpeakerLabelProps {
  speaker: SpeakerRole
}

const config: Record<SpeakerRole, { label: string; class: string; initial: string }> = {
  doctor: { label: 'Doctor', class: 'bg-blue-100 text-blue-700', initial: 'D' },
  patient: { label: 'Patient', class: 'bg-green-100 text-green-700', initial: 'P' },
  unknown: { label: 'Unknown', class: 'bg-gray-100 text-gray-500', initial: '?' },
}

export default function SpeakerLabel({ speaker }: SpeakerLabelProps) {
  const { label, class: cls, initial } = config[speaker]
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0 w-14 pt-3">
      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', cls)}>
        {initial}
      </div>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
    </div>
  )
}
