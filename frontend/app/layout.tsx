import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const dmMono = DM_Mono({ weight: '400', subsets: ['latin'], variable: '--font-dm-mono' })

export const metadata: Metadata = {
  title: 'MediScribe — AI Medical Transcription',
  description: 'Intelligent medical consultation transcription and clinical documentation powered by Claude AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${dmMono.variable} font-sans antialiased min-h-screen`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
