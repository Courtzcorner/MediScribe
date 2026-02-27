'use client'

import { Analysis } from '@/types/analysis'
import { useAnalysis } from '@/hooks/useAnalysis'
import { Brain, Loader2, RefreshCw } from 'lucide-react'
import SOAPNote from './SOAPNote'
import MedicationList from './MedicationList'
import DiagnosisSummary from './DiagnosisSummary'

interface AnalysisPanelProps {
  analysis: Analysis | null
  isStreaming: boolean
  streamedText: string
  sessionId: string
  transcriptId?: string
}

export default function AnalysisPanel({
  analysis: initialAnalysis,
  isStreaming: initialStreaming,
  streamedText: initialStreamedText,
  sessionId,
  transcriptId,
}: AnalysisPanelProps) {
  const { analysis, isAnalyzing, streamedText, error, startAnalysis } = useAnalysis()

  const activeAnalysis = analysis ?? initialAnalysis
  const activeStreaming = isAnalyzing || initialStreaming
  const activeStreamedText = streamedText || initialStreamedText

  const handleRunAnalysis = () => {
    if (transcriptId) startAnalysis(sessionId, transcriptId)
  }

  if (activeStreaming) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="font-medium text-gray-700">Generating clinical notes…</span>
          </div>
          {activeStreamedText && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {activeStreamedText}
              <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-0.5" />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!activeAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <Brain className="w-7 h-7 text-blue-400" />
        </div>
        <p className="text-gray-500 font-medium mb-2">No analysis yet</p>
        <p className="text-gray-400 text-sm mb-6">
          {transcriptId ? 'Run AI analysis on this transcript' : 'Complete a recording first'}
        </p>
        {transcriptId && (
          <button
            onClick={handleRunAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Brain className="w-4 h-4" />
            Generate clinical notes
          </button>
        )}
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Re-run button */}
      <div className="flex justify-end">
        <button
          onClick={handleRunAnalysis}
          disabled={!transcriptId || isAnalyzing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-40"
        >
          <RefreshCw className="w-3 h-3" />
          Re-run analysis
        </button>
      </div>

      {/* Summary */}
      {activeAnalysis.summary && (
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Summary</h3>
          <p className="text-sm text-blue-700 leading-relaxed">{activeAnalysis.summary}</p>
        </div>
      )}

      <SOAPNote soapNote={activeAnalysis.soapNote} />
      <DiagnosisSummary diagnoses={activeAnalysis.diagnoses} />
      <MedicationList medications={activeAnalysis.medications} />

      {/* Patient instructions */}
      {activeAnalysis.patientInstructions && (
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Patient Instructions</h3>
          <p className="text-sm text-green-700 leading-relaxed">{activeAnalysis.patientInstructions}</p>
        </div>
      )}

      {/* Key points */}
      {activeAnalysis.keyPoints.length > 0 && (
        <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100">
          <h3 className="text-sm font-semibold text-yellow-800 mb-3">Key Points</h3>
          <ul className="space-y-1.5">
            {activeAnalysis.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-yellow-700">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
