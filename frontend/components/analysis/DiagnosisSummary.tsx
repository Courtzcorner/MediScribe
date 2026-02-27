import { Diagnosis } from '@/types/analysis'
import { Activity } from 'lucide-react'
import { clsx } from 'clsx'

interface DiagnosisSummaryProps {
  diagnoses: Diagnosis[]
}

const severityColors: Record<string, string> = {
  mild: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  severe: 'bg-red-100 text-red-700',
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  existing: 'bg-gray-100 text-gray-600',
  resolved: 'bg-green-100 text-green-600',
}

export default function DiagnosisSummary({ diagnoses }: DiagnosisSummaryProps) {
  if (diagnoses.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-purple-500" />
        <h3 className="font-semibold text-gray-900">Diagnoses</h3>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {diagnoses.length}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {diagnoses.map((dx, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{dx.condition}</p>
                {dx.icdCode && (
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">ICD-10: {dx.icdCode}</p>
                )}
                {dx.notes && <p className="text-xs text-gray-500 mt-1">{dx.notes}</p>}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {dx.status && (
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusColors[dx.status] ?? 'bg-gray-100 text-gray-500')}>
                    {dx.status}
                  </span>
                )}
                {dx.severity && (
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', severityColors[dx.severity] ?? 'bg-gray-100 text-gray-500')}>
                    {dx.severity}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
