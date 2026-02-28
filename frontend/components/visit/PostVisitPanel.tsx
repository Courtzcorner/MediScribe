'use client'

import { useState } from 'react'
import { FileText, Save, CheckCircle, ClipboardList, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Analysis } from '@/types/analysis'
import SOAPNote from '@/components/analysis/SOAPNote'
import DiagnosisSummary from '@/components/analysis/DiagnosisSummary'

interface PostVisitPanelProps {
    analysis?: Analysis | null
    existingNotes?: string
    onSaveNotes: (notes: string) => Promise<void>
    onCompleteVisit?: () => Promise<void>
}

export function PostVisitPanel({
    analysis,
    existingNotes = '',
    onSaveNotes,
    onCompleteVisit
}: PostVisitPanelProps) {
    const [notes, setNotes] = useState(existingNotes)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleSave = async () => {
        setIsSaving(true)
        setSaveStatus('idle')
        try {
            await onSaveNotes(notes)
            setSaveStatus('success')
            setTimeout(() => setSaveStatus('idle'), 3000)
        } catch (error) {
            console.error('Failed to save notes:', error)
            setSaveStatus('error')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Clinician Notes Section - Primary focus in Post Visit */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="font-semibold text-foreground">Clinician Review & Notes</h2>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || notes === existingNotes}
                        className={cn(
                            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                            saveStatus === 'success'
                                ? "bg-green-500 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
                        )}
                    >
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : saveStatus === 'success' ? (
                            <>
                                <CheckCircle className="size-4" />
                                Saved
                            </>
                        ) : (
                            <>
                                <Save className="size-4" />
                                Save Notes
                            </>
                        )}
                    </button>
                </div>

                <div className="p-6">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Additional Visit Details & Observations
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Document any additional findings, patient behavior, or coordination of care not captured in the transcript..."
                        rows={10}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border border-border bg-background text-sm leading-relaxed resize-none",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all",
                            "placeholder:text-muted-foreground/60"
                        )}
                    />
                    {saveStatus === 'error' && (
                        <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5 font-medium">
                            <AlertCircle className="size-3.5" />
                            Failed to save changes. Please try again.
                        </p>
                    )}
                </div>
            </div>

            {/* Recap Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {analysis?.soapNote && (
                        <div className="opacity-90">
                            <SOAPNote soapNote={analysis.soapNote} />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {analysis && analysis.diagnoses.length > 0 && (
                        <div className="opacity-90">
                            <DiagnosisSummary diagnoses={analysis.diagnoses} />
                        </div>
                    )}

                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <ClipboardList className="size-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="font-semibold text-foreground text-sm">Action Items</h3>
                        </div>

                        <button
                            onClick={onCompleteVisit}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="size-5" />
                            Finalize & Close Visit
                        </button>
                        <p className="mt-3 text-center text-[11px] text-muted-foreground italic">
                            Finalizing will lock the notes and mark the session as completed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
