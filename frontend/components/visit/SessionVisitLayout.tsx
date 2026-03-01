'use client'

import { useState } from 'react'
import { VisitSidebar, type SidebarItem } from './VisitSidebar'
import { VisitHeader } from './VisitHeader'
import { VisitTabs, type VisitTab } from './VisitTabs'
import { LiveContext } from './LiveContext'
import { TreatmentPlan } from './TreatmentPlan'
import { TranscriptPanel } from './TranscriptPanel'
import { PreVisitPanel } from './PreVisitPanel'
import { AskPanel } from './AskPanel'
import { PostVisitPanel } from './PostVisitPanel'
import SOAPNote from '@/components/analysis/SOAPNote'
import DiagnosisSummary from '@/components/analysis/DiagnosisSummary'
import MedicationList from '@/components/analysis/MedicationList'
import type { Analysis, FollowUp } from '@/types/analysis'
import type { Patient } from '@/types/patient'
import type { SpeechEntry } from '@/hooks/useLiveSpeech'
import type { RecorderState } from '@/hooks/useRecorder'
import { FileText, Users, FileCheck, ClipboardList, FileEdit, Calendar, FlaskConical, Scan } from 'lucide-react'

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

  // Post visit notes
  notes?: string
  onSaveNotes?: (notes: string) => Promise<void>
  onCompleteVisit?: () => Promise<void>
}

function EmptyPanel({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 min-h-[300px] flex flex-col items-center justify-center text-center">
      <div className="size-14 rounded-full flex items-center justify-center mb-4 bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    </div>
  )
}

function ReferralsView({ followUp }: { followUp: FollowUp }) {
  const hasReferrals = followUp.referrals && followUp.referrals.length > 0
  const hasLabs = followUp.labOrders && followUp.labOrders.length > 0
  const hasImaging = followUp.imagingOrders && followUp.imagingOrders.length > 0

  return (
    <div className="space-y-4">
      {/* Follow-up timeframe */}
      {followUp.timeframe && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="size-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">Follow-up</h3>
          </div>
          <p className="text-sm text-foreground font-medium">{followUp.timeframe}</p>
          {followUp.instructions && (
            <p className="text-sm text-muted-foreground mt-1">{followUp.instructions}</p>
          )}
        </div>
      )}

      {/* Referrals */}
      {hasReferrals && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="size-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-foreground">Referrals</h3>
            <span className="ml-auto text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
              {followUp.referrals!.length}
            </span>
          </div>
          <ul className="space-y-2">
            {followUp.referrals!.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <span className="size-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lab orders */}
      {hasLabs && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="size-4 text-teal-500" />
            <h3 className="text-sm font-semibold text-foreground">Lab Orders</h3>
            <span className="ml-auto text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">
              {followUp.labOrders!.length}
            </span>
          </div>
          <ul className="space-y-2">
            {followUp.labOrders!.map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground p-2.5 rounded-lg bg-teal-500/5 border border-teal-500/10">
                <span className="size-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Imaging orders */}
      {hasImaging && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Scan className="size-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-foreground">Imaging Orders</h3>
            <span className="ml-auto text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
              {followUp.imagingOrders!.length}
            </span>
          </div>
          <ul className="space-y-2">
            {followUp.imagingOrders!.map((img, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <span className="size-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                {img}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasReferrals && !hasLabs && !hasImaging && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">No referrals or orders in the analysis.</p>
        </div>
      )}
    </div>
  )
}

function VisitSummaryView({ analysis }: { analysis: Analysis }) {
  return (
    <div className="space-y-4">
      {analysis.summary && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck className="size-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">Summary</h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {analysis.patientInstructions && (
        <div className="rounded-xl border border-border bg-green-500/5 p-5 border-green-500/20">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">Patient Instructions</h3>
          <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
            {analysis.patientInstructions}
          </p>
        </div>
      )}

      {analysis.keyPoints.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">Key Points</h3>
          <ul className="space-y-2">
            {analysis.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                <span className="size-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
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
  notes = '',
  onSaveNotes,
  onCompleteVisit,
}: SessionVisitLayoutProps) {
  const isRecording = recorderState === 'recording' || recorderState === 'paused'
  const [sidebarItem, setSidebarItem] = useState<SidebarItem>('clinical-focus')

  const renderSidebarContent = () => {
    switch (sidebarItem) {
      case 'transcript':
        return (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2 text-muted-foreground">
              <FileText className="size-5" />
              <h2 className="font-semibold uppercase text-sm tracking-wide">Transcript</h2>
            </div>
            <div className="h-[560px] overflow-y-auto">
              {transcriptContent ?? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <p className="text-sm text-muted-foreground">No transcript available yet.</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'clinical-focus':
        return (
          <>
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
          </>
        )

      case 'clinical-fields':
        return analysis ? (
          <div className="space-y-4">
            <DiagnosisSummary diagnoses={analysis.diagnoses} />
            {analysis.medications.length > 0 && (
              <MedicationList medications={analysis.medications} />
            )}
          </div>
        ) : (
          <EmptyPanel
            icon={<ClipboardList className="size-7" />}
            message="Clinical fields will appear after the encounter analysis is complete."
          />
        )

      case 'draft-note':
        return analysis?.soapNote ? (
          <SOAPNote soapNote={analysis.soapNote} />
        ) : (
          <EmptyPanel
            icon={<FileEdit className="size-7" />}
            message="The SOAP note will appear after the encounter analysis is complete."
          />
        )

      case 'referrals':
        return analysis?.followUp ? (
          <ReferralsView followUp={analysis.followUp} />
        ) : (
          <EmptyPanel
            icon={<Users className="size-7" />}
            message="Referrals and orders will appear after the encounter analysis is complete."
          />
        )

      case 'visit-summary':
        return analysis ? (
          <VisitSummaryView analysis={analysis} />
        ) : (
          <EmptyPanel
            icon={<FileCheck className="size-7" />}
            message="The visit summary will appear after the encounter analysis is complete."
          />
        )

      case 'ask':
        return <AskPanel sessionId={sessionId} transcriptId={transcriptId} />

      default:
        return null
    }
  }

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      <VisitSidebar
        sessionId={sessionId}
        activeItem={sidebarItem}
        onItemChange={setSidebarItem}
      />

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
                onChiefComplaintChange={onChiefComplaintChange ?? (() => { })}
                visitType={visitType}
                onVisitTypeChange={onVisitTypeChange ?? (() => { })}
                onStartEncounter={onStartEncounter ?? (() => { })}
              />
            )}

            {activeTab === 'during' && (
              <div className="space-y-6">
                {/* Recording controls banner */}
                {recorderState !== 'stopped' && (
                  <div className={`rounded-xl border p-4 flex items-center gap-4 ${isRecording
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

                {renderSidebarContent()}
              </div>
            )}

            {activeTab === 'postvisit' && (
              <PostVisitPanel
                analysis={analysis}
                existingNotes={notes}
                onSaveNotes={onSaveNotes ?? (async () => { })}
                onCompleteVisit={onCompleteVisit}
                supplementalContent={renderSidebarContent()}
              />
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
