import { SOAPNote as SOAPNoteType } from '@/types/analysis'

interface SOAPNoteProps {
  soapNote: SOAPNoteType
}

const sections = [
  { key: 'subjective', label: 'S — Subjective', color: 'border-l-blue-400 bg-blue-50/50' },
  { key: 'objective', label: 'O — Objective', color: 'border-l-purple-400 bg-purple-50/50' },
  { key: 'assessment', label: 'A — Assessment', color: 'border-l-orange-400 bg-orange-50/50' },
  { key: 'plan', label: 'P — Plan', color: 'border-l-green-400 bg-green-50/50' },
] as const

export default function SOAPNote({ soapNote }: SOAPNoteProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">SOAP Note</h3>
      </div>
      <div className="p-5 space-y-4">
        {sections.map(({ key, label, color }) => (
          <div key={key} className={`border-l-4 rounded-r-xl pl-4 pr-3 py-3 ${color}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {soapNote[key] || <span className="text-gray-300 italic">Not documented</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
