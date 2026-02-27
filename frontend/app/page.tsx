import Link from 'next/link'
import { Mic, FileText, Brain, Shield, Clock, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Mic,
    title: 'Real-Time Recording',
    description: 'Capture consultations with high-quality audio and automatic speaker diarization.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Claude AI generates SOAP notes, extracts medications, diagnoses, and follow-up plans instantly.',
  },
  {
    icon: FileText,
    title: 'Structured Documentation',
    description: 'Every session produces structured clinical notes ready for your EHR system.',
  },
  {
    icon: Shield,
    title: 'HIPAA Compliant',
    description: 'End-to-end encryption, automatic PII redaction, and audit logging built in.',
  },
  {
    icon: Clock,
    title: 'Save Hours Daily',
    description: 'Eliminate after-hours charting. Notes are ready before the patient leaves.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Nav */}
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MediScribe</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-8">
          <Brain className="w-3.5 h-3.5" />
          Powered by Claude AI + Amazon Transcribe
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Medical Documentation,<br />
          <span className="text-blue-600">Done in Seconds</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          MediScribe transcribes your consultations, identifies speakers, and generates complete
          clinical notes — so you can focus on your patients, not paperwork.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Start free trial <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/sessions"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-gray-700 font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            View dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
