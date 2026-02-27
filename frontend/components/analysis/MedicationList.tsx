import { Medication } from '@/types/analysis'
import { Pill } from 'lucide-react'

interface MedicationListProps {
  medications: Medication[]
}

export default function MedicationList({ medications }: MedicationListProps) {
  if (medications.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Pill className="w-4 h-4 text-blue-500" />
        <h3 className="font-semibold text-gray-900">Medications</h3>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {medications.length}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {medications.map((med, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{med.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {med.dosage} · {med.frequency}
                  {med.route && ` · ${med.route}`}
                  {med.duration && ` · ${med.duration}`}
                </p>
                {med.instructions && (
                  <p className="text-xs text-gray-400 mt-1 italic">{med.instructions}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
