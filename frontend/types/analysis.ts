export interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration?: string
  route?: string
  instructions?: string
}

export interface Diagnosis {
  condition: string
  icdCode?: string
  severity?: 'mild' | 'moderate' | 'severe'
  status?: 'new' | 'existing' | 'resolved'
  notes?: string
}

export interface FollowUp {
  timeframe: string
  instructions: string
  referrals?: string[]
  labOrders?: string[]
  imagingOrders?: string[]
}

export interface Analysis {
  id: string
  sessionId: string
  transcriptId: string
  summary: string
  soapNote: SOAPNote
  medications: Medication[]
  diagnoses: Diagnosis[]
  followUp?: FollowUp
  keyPoints: string[]
  patientInstructions?: string
  createdAt: string
  modelUsed: string
}

export type AnalysisStatus = 'pending' | 'streaming' | 'completed' | 'failed'

export interface AnalysisStreamEvent {
  type: 'chunk' | 'complete' | 'error'
  content?: string
  analysis?: Analysis
  error?: string
}
