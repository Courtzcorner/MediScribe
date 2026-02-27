import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MediScribe — AI Medical Transcription',
  description: 'Intelligent medical consultation transcription and clinical documentation powered by Claude AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
