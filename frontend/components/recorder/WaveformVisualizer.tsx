'use client'

import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'

interface WaveformVisualizerProps {
  isRecording: boolean
}

const BAR_COUNT = 32

export default function WaveformVisualizer({ isRecording }: WaveformVisualizerProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isRecording) {
      // Reset bars
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.transform = 'scaleY(0.15)'
      })
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }

    const animate = () => {
      barsRef.current.forEach((bar, i) => {
        if (!bar) return
        const scale = 0.15 + Math.random() * 0.85
        bar.style.transform = `scaleY(${scale})`
        bar.style.transition = `transform ${50 + i * 5}ms ease`
      })
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isRecording])

  return (
    <div className="flex items-center justify-center gap-1 h-20 px-4">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el }}
          className={clsx(
            'w-1.5 rounded-full origin-bottom transition-transform',
            isRecording ? 'bg-blue-500' : 'bg-gray-200'
          )}
          style={{ height: '100%', transform: 'scaleY(0.15)' }}
        />
      ))}
    </div>
  )
}
