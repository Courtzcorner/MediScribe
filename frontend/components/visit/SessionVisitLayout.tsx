'use client'

import { useState } from 'react'
import { VisitSidebar, SidebarSection } from './VisitSidebar'
import { VisitHeader } from './VisitHeader'
import { VisitTabs } from './VisitTabs'
import { LiveContext } from './LiveContext'
import { TreatmentPlan } from './TreatmentPlan'
import { TranscriptPanel } from './TranscriptPanel'

interface SessionVisitLayoutProps {
  sessionId: string
  title?: string
  subtitle?: string
  /** Shown by default (Transcript tab) — analysis summary + SOAP + diagnoses */
  liveContextContent?: React.ReactNode
  /** Draft Note tab — SOAP note only */
  soapContent?: React.ReactNode
  /** Clinical Fields tab — diagnoses */
  diagnosisContent?: React.ReactNode
  /** Referrals tab */
  referralsContent?: React.ReactNode
  /** Visit Summary tab */
  summaryContent?: React.ReactNode
  /** Treatment Plan section (always visible below Live Context) */
  treatmentContent?: React.ReactNode
  /** Right-hand transcript panel */
  transcriptContent?: React.ReactNode
  transcriptEntryCount?: number
}

export function SessionVisitLayout({
  sessionId,
  title = 'Laasya',
  subtitle = 'New symptom evaluation',
  liveContextContent,
  soapContent,
  diagnosisContent,
  referralsContent,
  summaryContent,
  treatmentContent,
  transcriptContent,
  transcriptEntryCount = 0,
}: SessionVisitLayoutProps) {
  const [activeSection, setActiveSection] = useState<SidebarSection>('transcript')

  const mainContent = () => {
    switch (activeSection) {
      case 'draft-note':      return soapContent
      case 'clinical-fields': return diagnosisContent
      case 'referrals':       return referralsContent
      case 'visit-summary':   return summaryContent
      default:                return liveContextContent
    }
  }

  return (
    <div className="size-full flex bg-background">
      <VisitSidebar
        sessionId={sessionId}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <VisitHeader title={title} subtitle={subtitle} />
        <VisitTabs />

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            <LiveContext>{mainContent()}</LiveContext>
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
