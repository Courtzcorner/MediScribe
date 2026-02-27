import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const sessionId = formData.get('sessionId') as string

  if (!sessionId) {
    return NextResponse.json({ detail: 'sessionId required' }, { status: 400 })
  }

  const authHeader = request.headers.get('Authorization') ?? ''

  const backendForm = new FormData()
  const audio = formData.get('audio')
  if (audio) backendForm.append('audio', audio)
  const language = formData.get('language') || 'en-US'
  backendForm.append('language', language as string)

  const res = await fetch(`${BACKEND_URL}/transcribe/${sessionId}`, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: backendForm,
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
