'use client'

import { VisitSidebar } from './VisitSidebar'
import { VisitHeader } from './VisitHeader'
import { VisitTabs } from './VisitTabs'
import { LiveContext } from './LiveContext'
import { TreatmentPlan } from './TreatmentPlan'
import { TranscriptPanel } from './TranscriptPanel'

interface SessionVisitLayoutProps {
  sessionId: string
  title?: string
  subtitle?: string
  transcriptContent?: React.ReactNode
  liveContextContent?: React.ReactNode
  treatmentContent?: React.ReactNode
  transcriptEntryCount?: number
}

export function SessionVisitLayout({
  sessionId,
  title = 'Laasya',
  subtitle = 'New symptom evaluation',
  transcriptContent,
  liveContextContent,
  treatmentContent,
  transcriptEntryCount = 0,
}: SessionVisitLayoutProps) {
  return (
    <div className="size-full flex bg-background">
      <VisitSidebar sessionId={sessionId} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <VisitHeader title={title} subtitle={subtitle} />
        <VisitTabs />

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            <LiveContext>{liveContextContent}</LiveContext>
            <TreatmentPlan>{treatmentContent}</TreatmentPlan>
          </div>
        </div>
      </div>

      <TranscriptPanel entryCount={transcriptEntryCount}>
        {transcriptContent}
      </TranscriptPanel>
    </div>
  )
}
