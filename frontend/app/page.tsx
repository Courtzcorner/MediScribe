import Link from 'next/link'
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  Mic,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  AudioWaveform,
} from 'lucide-react'

const heroStats = [
  { value: '< 2 min', label: 'from recording to structured note' },
  { value: '3 outputs', label: 'transcript, SOAP note, follow-up plan' },
  { value: '1 workspace', label: 'for capture, review, and export' },
]

const featureCards = [
  {
    icon: AudioWaveform,
    title: 'Capture the visit live',
    description:
      'Record consultations with a workflow built for exam rooms, telehealth, and fast follow-up visits.',
  },
  {
    icon: Brain,
    title: 'Turn conversation into clinical structure',
    description:
      'Generate note-ready summaries, diagnoses, medications, and action items from the raw transcript.',
  },
  {
    icon: ShieldCheck,
    title: 'Keep documentation controlled',
    description:
      'Review the output, edit phrasing, and move forward with an auditable transcript and note history.',
  },
]

const workflowSteps = [
  {
    id: '01',
    title: 'Start a session',
    description:
      'Open a fresh visit workspace, begin recording, and keep the encounter moving without switching tools.',
  },
  {
    id: '02',
    title: 'Watch the transcript build',
    description:
      'Speaker-aware transcription turns the conversation into a clean running record as the visit happens.',
  },
  {
    id: '03',
    title: 'Finish with structured output',
    description:
      'Review SOAP-style summaries, diagnoses, medications, and next steps before the patient leaves.',
  },
]

const trustPoints = [
  'Built for clinicians who need speed without giving up review control.',
  'Structured outputs help reduce after-hours charting and duplicate data entry.',
  'A single dashboard keeps active recordings and completed sessions in one place.',
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(245,158,11,0.16),_transparent_24%),linear-gradient(180deg,_#f7fbfc_0%,_#ffffff_45%,_#f3f6ef_100%)] text-slate-900">
      <section className="relative isolate border-b border-slate-200/70">
        <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(90deg,rgba(15,118,110,0.08),rgba(245,158,11,0.08),rgba(14,116,144,0.08))]" />
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_14px_40px_rgba(15,23,42,0.18)]">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">MediScribe</p>
                <p className="text-sm text-slate-500">Clinical documentation workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-slate-950"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>

          <div className="grid gap-14 py-16 lg:grid-cols-[minmax(0,1.1fr)_430px] lg:items-center lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-teal-800 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                From conversation to chart-ready output
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight text-slate-950 md:text-7xl">
                Finish the note while the visit is still fresh.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                MediScribe records the encounter, builds a speaker-aware transcript, and shapes the
                visit into structured clinical documentation inside one workflow.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/sessions"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
                >
                  Open dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/sessions/new"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/90 px-6 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                >
                  Start recording
                  <Mic className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.14)] backdrop-blur"
                  >
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-8 hidden h-24 w-24 rounded-full bg-amber-300/30 blur-2xl lg:block" />
              <div className="absolute -right-6 bottom-12 hidden h-28 w-28 rounded-full bg-teal-400/20 blur-2xl lg:block" />
              <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_40px_120px_rgba(15,23,42,0.28)]">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Live session</p>
                    <p className="mt-1 text-lg font-semibold">Follow-up consultation</p>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    Recording
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] bg-white px-5 py-5 text-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Generated summary</p>
                      <p className="text-xl font-semibold tracking-tight">SOAP note draft</p>
                    </div>
                    <FileText className="h-5 w-5 text-teal-700" />
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Subjective
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Patient reports reduced wheezing overnight and no fever since Friday.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-teal-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                          Assessment
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          Improving bronchitis with residual cough.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                          Plan
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          Continue inhaler. Recheck in one week if symptoms persist.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <Stethoscope className="h-4 w-4" />
                      Diagnoses
                    </div>
                    <p className="mt-2 text-sm text-white">Acute bronchitis, improving</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <Clock3 className="h-4 w-4" />
                      Review time
                    </div>
                    <p className="mt-2 text-sm text-white">Under 90 seconds before export</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Why teams use it
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              A documentation flow that feels operational, not experimental.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-slate-600">
            The product is designed around the moment clinicians actually lose time: after the
            patient has left, when the chart still needs to be written.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[28px] border border-slate-200 bg-white/85 p-7 shadow-[0_24px_60px_rgba(148,163,184,0.12)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">{card.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-300">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Stay in the visit, then review the output with context intact.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
              Recording, transcription, and note generation stay connected so the final chart does
              not feel disconnected from what was actually said.
            </p>
          </div>

          <div className="grid gap-4">
            {workflowSteps.map((step) => (
              <div
                key={step.id}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
                  {step.id}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f6faf8_100%)] p-8 shadow-[0_28px_80px_rgba(148,163,184,0.14)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Trust and control
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Keep the AI useful by keeping the clinician in charge.
            </h2>
            <div className="mt-8 space-y-4">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <p className="text-base leading-7 text-slate-600">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] bg-[linear-gradient(160deg,#0f172a_0%,#122c2c_100%)] p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
              Start now
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Open the workspace and run your next visit through it.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              The fastest way to evaluate the product is to record a real session and inspect the
              generated note inside the dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Create account
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sessions"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Explore sessions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
