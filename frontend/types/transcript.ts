export type SpeakerRole = 'doctor' | 'patient' | 'unknown'

export interface TranscriptSegment {
  id: string
  speaker: SpeakerRole
  text: string
  startTime: number   // seconds from recording start
  endTime: number
  confidence: number  // 0–1
}

export interface Transcript {
  id: string
  sessionId: string
  segments: TranscriptSegment[]
  rawText: string
  language: string
  wordCount: number
  createdAt: string
  updatedAt: string
}

export interface UpdateSegmentPayload {
  text: string
  speaker?: SpeakerRole
}
