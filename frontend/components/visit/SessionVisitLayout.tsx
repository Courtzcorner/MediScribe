'use client'

import { VisitSidebar } from './VisitSidebar'
import { VisitHeader } from './VisitHeader'
import { VisitTabs, type VisitTab } from './VisitTabs'
import { LiveContext } from './LiveContext'
import { TreatmentPlan } from './TreatmentPlan'
import { TranscriptPanel } from './TranscriptPanel'
import { PreVisitPanel } from './PreVisitPanel'
import type { Analysis } from '@/types/analysis'
import type { Patient } from '@/types/patient'
import type { SpeechEntry } from '@/hooks/useLiveSpeech'
import type { RecorderState } from '@/hooks/useRecorder'

interface SessionVisitLayoutProps {
  sessionId: string
  transcriptId?: string | null
  analysis?: Analysis | null
  title?: string
  subtitle?: string
  transcriptContent?: React.ReactNode
  liveContextContent?: React.ReactNode
  treatmentContent?: React.ReactNode
  transcriptEntryCount?: number

  // Patient + visit state
  patient?: Patient | null
  activeTab: VisitTab
  onTabChange: (tab: VisitTab) => void
  postVisitEnabled?: boolean
  chiefComplaint?: string
  onChiefComplaintChange?: (v: string) => void
  visitType?: string
  onVisitTypeChange?: (v: string) => void

  // Recording
  recorderState?: RecorderState
  recordingDuration?: string
  onStartEncounter?: () => void
  onEndEncounter?: () => void

  // Live speech
  liveEntries?: SpeechEntry[]
  liveText?: string
}

export function SessionVisitLayout({
  sessionId,
  transcriptId,
  analysis,
  title = 'Patient',
  subtitle = 'New symptom evaluation',
  transcriptContent,
  liveContextContent,
  treatmentContent,
  transcriptEntryCount = 0,
  patient,
  activeTab,
  onTabChange,
  postVisitEnabled = false,
  chiefComplaint = '',
  onChiefComplaintChange,
  visitType = 'ROUTINE',
  onVisitTypeChange,
  recorderState = 'idle',
  recordingDuration,
  onStartEncounter,
  onEndEncounter,
  liveEntries = [],
  liveText = '',
}: SessionVisitLayoutProps) {
  const isRecording = recorderState === 'recording' || recorderState === 'paused'

  return (
    <div className="size-full flex bg-background">
      <VisitSidebar sessionId={sessionId} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <VisitHeader
          title={title}
          subtitle={subtitle}
          visitType={visitType}
          onVisitTypeChange={onVisitTypeChange}
          isRecording={isRecording}
          onEndEncounter={isRecording ? onEndEncounter : undefined}
          recordingDuration={recordingDuration}
        />
        <VisitTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          postVisitEnabled={postVisitEnabled}
        />

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            {activeTab === 'previsit' && (
              <PreVisitPanel
                patient={patient}
                chiefComplaint={chiefComplaint}
                onChiefComplaintChange={onChiefComplaintChange ?? (() => {})}
                visitType={visitType}
                onVisitTypeChange={onVisitTypeChange ?? (() => {})}
                onStartEncounter={onStartEncounter ?? (() => {})}
              />
            )}

            {activeTab === 'during' && (
              <div className="space-y-6">
                {/* Recording controls banner */}
                {recorderState !== 'stopped' && (
                  <div className={`rounded-xl border p-4 flex items-center gap-4 ${
                    isRecording
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-border bg-card'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {isRecording ? 'Recording in progress…' : 'Ready to record'}
                      </p>
                      {isRecording && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Speak clearly. Live transcript and AI questions are updating in real-time.
                        </p>
                      )}
                    </div>
                    {recordingDuration && isRecording && (
                      <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400 flex-shrink-0">
                        {recordingDuration}
                      </span>
                    )}
                  </div>
                )}

                <LiveContext
                  sessionId={sessionId}
                  transcriptId={transcriptId}
                  analysis={analysis}
                  liveText={liveText}
                  isRecording={isRecording}
                >
                  {liveContextContent}
                </LiveContext>

                <TreatmentPlan>{treatmentContent}</TreatmentPlan>
              </div>
            )}

            {activeTab === 'postvisit' && (
              <div className="space-y-6">
                <LiveContext
                  sessionId={sessionId}
                  transcriptId={transcriptId}
                  analysis={analysis}
                >
                  {liveContextContent}
                </LiveContext>
                <TreatmentPlan>{treatmentContent}</TreatmentPlan>
              </div>
            )}
          </div>
        </div>
      </div>

      <TranscriptPanel
        entryCount={transcriptEntryCount}
        isReady={recorderState !== 'idle' || !!transcriptId}
        isRecording={isRecording}
        liveEntries={liveEntries}
      >
        {!isRecording ? transcriptContent : undefined}
      </TranscriptPanel>
    </div>
  )
}
