'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, ArrowLeft, User, ChevronRight, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { Patient, CreatePatientPayload } from '@/types/patient'
import { Session } from '@/types/session'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'

type Step = 'search' | 'register'

export default function NewSessionPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Register form state
  const [form, setForm] = useState<CreatePatientPayload>({
    firstName: '',
    lastName: '',
    dob: '',
    gender: undefined,
    phone: '',
    email: '',
    allergies: [],
    currentMedications: [],
    conditions: [],
  })
  const [allergyInput, setAllergyInput] = useState('')
  const [medInput, setMedInput] = useState('')
  const [conditionInput, setConditionInput] = useState('')

  // Search patients whenever query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!query.trim()) {
        // Load recent patients when no query
        setSearching(true)
        try {
          const list = await api.get<Patient[]>('/patients/?limit=10')
          setPatients(list)
        } catch {
          setPatients([])
        } finally {
          setSearching(false)
        }
        return
      }
      setSearching(true)
      try {
        const list = await api.get<Patient[]>(`/patients/?search=${encodeURIComponent(query)}&limit=20`)
        setPatients(list)
      } catch {
        setPatients([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const startSessionForPatient = async (patient: Patient) => {
    setCreating(true)
    setError('')
    try {
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const session = await api.post<Session>('/sessions/', {
        title: `${patient.firstName} ${patient.lastName} — Visit (${today})`,
        patientId: patient.id,
      })
      router.push(`/sessions/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      setCreating(false)
    }
  }

  const registerAndStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) return
    setCreating(true)
    setError('')
    try {
      const patient = await api.post<Patient>('/patients/', {
        ...form,
        allergies: form.allergies ?? [],
        currentMedications: form.currentMedications ?? [],
        conditions: form.conditions ?? [],
      })
      await startSessionForPatient(patient)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register patient')
      setCreating(false)
    }
  }

  const addTag = (field: 'allergies' | 'currentMedications' | 'conditions', value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setForm((f) => ({ ...f, [field]: [...(f[field] ?? []), trimmed] }))
  }

  const removeTag = (field: 'allergies' | 'currentMedications' | 'conditions', idx: number) => {
    setForm((f) => ({ ...f, [field]: (f[field] ?? []).filter((_, i) => i !== idx) }))
  }

  const ageFromDob = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="New Session" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/sessions"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sessions
            </Link>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                {error}
              </div>
            )}

            {step === 'search' ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900 text-lg mb-1">Select Patient</h2>
                  <p className="text-sm text-gray-500">Search for an existing patient or register a new one</p>

                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name, MRN, or phone…"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Results */}
                <div className="divide-y divide-gray-50">
                  {patients.length === 0 && !searching ? (
                    <div className="px-8 py-8 text-center text-gray-400 text-sm">
                      {query ? 'No patients found matching your search.' : 'No patients registered yet.'}
                    </div>
                  ) : (
                    patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => startSessionForPatient(patient)}
                        disabled={creating}
                        className="w-full flex items-center gap-4 px-8 py-4 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{patient.mrn}</span>
                            {patient.dob && <span>· Age {ageFromDob(patient.dob)}</span>}
                            {patient.gender && <span>· {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</span>}
                          </div>
                        </div>
                        {creating ? (
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Register new patient */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={() => setStep('register')}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm font-medium"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register New Patient
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                  <button
                    onClick={() => setStep('search')}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to search
                  </button>
                  <h2 className="font-semibold text-gray-900 text-lg mb-1">Register New Patient</h2>
                  <p className="text-sm text-gray-500">Fill in basic details — you can add more later</p>
                </div>

                <form onSubmit={registerAndStart} className="px-8 py-6 space-y-5">
                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        placeholder="Jane"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last name <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        placeholder="Smith"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* DOB + Gender */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
                      <input
                        type="date"
                        value={form.dob ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={form.gender ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as any || undefined }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select…</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {/* Phone + Email */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        value={form.phone ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={form.email ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="patient@email.com"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Allergies */}
                  <TagInput
                    label="Allergies"
                    tags={form.allergies ?? []}
                    inputValue={allergyInput}
                    onInputChange={setAllergyInput}
                    onAdd={() => { addTag('allergies', allergyInput); setAllergyInput('') }}
                    onRemove={(i) => removeTag('allergies', i)}
                    placeholder="e.g. Penicillin"
                    tagColor="red"
                  />

                  {/* Current medications */}
                  <TagInput
                    label="Current medications"
                    tags={form.currentMedications ?? []}
                    inputValue={medInput}
                    onInputChange={setMedInput}
                    onAdd={() => { addTag('currentMedications', medInput); setMedInput('') }}
                    onRemove={(i) => removeTag('currentMedications', i)}
                    placeholder="e.g. Metformin 500mg"
                    tagColor="blue"
                  />

                  {/* Medical conditions */}
                  <TagInput
                    label="Medical history / conditions"
                    tags={form.conditions ?? []}
                    inputValue={conditionInput}
                    onInputChange={setConditionInput}
                    onAdd={() => { addTag('conditions', conditionInput); setConditionInput('') }}
                    onRemove={(i) => removeTag('conditions', i)}
                    placeholder="e.g. Type 2 Diabetes"
                    tagColor="purple"
                  />

                  <button
                    type="submit"
                    disabled={creating || !form.firstName.trim() || !form.lastName.trim()}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registering & starting session…
                      </>
                    ) : (
                      'Register & Start Session'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

interface TagInputProps {
  label: string
  tags: string[]
  inputValue: string
  onInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (i: number) => void
  placeholder: string
  tagColor: 'red' | 'blue' | 'purple'
}

function TagInput({ label, tags, inputValue, onInputChange, onAdd, onRemove, placeholder, tagColor }: TagInputProps) {
  const colorMap = {
    red: 'bg-red-50 text-red-700 border border-red-100',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border border-purple-100',
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag, i) => (
            <span key={i} className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', colorMap[tagColor])}>
              {tag}
              <button type="button" onClick={() => onRemove(i)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
