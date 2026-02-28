'use client'

import { User, Calendar, Phone, Mail, AlertCircle, Pill, Stethoscope, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Patient } from '@/types/patient'

interface PreVisitPanelProps {
  patient?: Patient | null
  chiefComplaint: string
  onChiefComplaintChange: (v: string) => void
  visitType: string
  onVisitTypeChange: (v: string) => void
  onStartEncounter: () => void
}

export function PreVisitPanel({
  patient,
  chiefComplaint,
  onChiefComplaintChange,
  visitType,
  onVisitTypeChange,
  onStartEncounter,
}: PreVisitPanelProps) {
  const ageFromDob = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  return (
    <div className="space-y-5">
      {/* Patient demographics card */}
      {patient ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="size-14 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <User className="size-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{patient.mrn}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {patient.dob && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4 flex-shrink-0" />
                <span>
                  {new Date(patient.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  <span className="ml-1 text-foreground font-medium">({ageFromDob(patient.dob)} yrs)</span>
                </span>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4 flex-shrink-0" />
                <span className="capitalize">{patient.gender.replace('_', ' ')}</span>
              </div>
            )}
            {patient.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4 flex-shrink-0" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 flex-shrink-0" />
                <span className="truncate">{patient.email}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-3 text-muted-foreground">
          <User className="size-5" />
          <span className="text-sm">No patient record linked to this session.</span>
        </div>
      )}

      {/* Medical history */}
      {patient && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MedicalSection
            icon={<AlertCircle className="size-4 text-red-500" />}
            title="Allergies"
            items={patient.allergies}
            emptyText="None documented"
            tagClass="bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
          />
          <MedicalSection
            icon={<Pill className="size-4 text-blue-500" />}
            title="Current Medications"
            items={patient.currentMedications}
            emptyText="None documented"
            tagClass="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
          />
          <MedicalSection
            icon={<Stethoscope className="size-4 text-purple-500" />}
            title="Medical History"
            items={patient.conditions}
            emptyText="None documented"
            tagClass="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
          />
        </div>
      )}

      {/* Visit setup */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Today's Visit</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Visit type
            </label>
            <select
              value={visitType}
              onChange={(e) => onVisitTypeChange(e.target.value)}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm',
                'text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            >
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="FOLLOW-UP">Follow-up</option>
              <option value="NEW_PATIENT">New Patient</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Chief complaint
            </label>
            <textarea
              value={chiefComplaint}
              onChange={(e) => onChiefComplaintChange(e.target.value)}
              placeholder="Patient's primary reason for today's visit…"
              rows={3}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-none',
                'text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
          </div>
        </div>
      </div>

      {/* Start encounter */}
      <button
        onClick={onStartEncounter}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-base transition-all shadow-lg shadow-green-500/20"
      >
        <div className="size-6 rounded-full bg-white/20 flex items-center justify-center">
          <Play className="size-3.5 fill-white text-white" />
        </div>
        Start Encounter &amp; Recording
      </button>
    </div>
  )
}

interface MedicalSectionProps {
  icon: React.ReactNode
  title: string
  items: string[]
  emptyText: string
  tagClass: string
}

function MedicalSection({ icon, title, items, emptyText, tagClass }: MedicalSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className={cn('px-2 py-0.5 rounded-full text-xs font-medium', tagClass)}>
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
