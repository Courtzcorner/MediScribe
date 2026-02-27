'use client'

import { Link2, Sparkles, Syringe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TreatmentPlanProps {
  children?: React.ReactNode
}

export function TreatmentPlan({ children }: TreatmentPlanProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full flex items-center justify-center bg-teal-500/10">
            <Link2 className="size-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Treatment Plan</h3>
            <p className="text-sm text-muted-foreground">AI-generated treatment recommendations</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-all">
          <Sparkles className="size-4" />
          Generate Treatment
        </button>
      </div>

      {children ?? (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <div className="size-20 rounded-2xl flex items-center justify-center mb-4 bg-teal-500/10">
            <Syringe className="size-10 text-teal-500 dark:text-teal-400" />
          </div>
          <h4 className="font-semibold mb-2 text-foreground">No Treatment Plan Yet</h4>
          <p className="text-sm max-w-lg text-muted-foreground">
            Click &quot;Generate Treatment&quot; after recording the encounter to get AI-powered
            medication and treatment recommendations.
          </p>
        </div>
      )}
    </div>
  )
}
