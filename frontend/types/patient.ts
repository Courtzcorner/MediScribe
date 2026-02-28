export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export interface Patient {
  id: string
  mrn: string
  firstName: string
  lastName: string
  dob?: string
  gender?: Gender
  phone?: string
  email?: string
  allergies: string[]
  currentMedications: string[]
  conditions: string[]
  doctorId: string
  createdAt: string
  updatedAt: string
}

export interface CreatePatientPayload {
  firstName: string
  lastName: string
  dob?: string
  gender?: Gender
  phone?: string
  email?: string
  allergies?: string[]
  currentMedications?: string[]
  conditions?: string[]
}
