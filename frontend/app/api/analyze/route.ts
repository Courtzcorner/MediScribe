import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const authHeader = request.headers.get('Authorization') ?? ''

  // Forward to backend streaming endpoint and proxy SSE back to client
  const backendRes = await fetch(`${BACKEND_URL}/analyze/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      session_id: body.sessionId,
      transcript_id: body.transcriptId,
    }),
  })

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({ detail: 'Analysis failed' }))
    return NextResponse.json(error, { status: backendRes.status })
  }

  // Proxy the SSE stream
  return new NextResponse(backendRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
