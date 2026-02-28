import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

async function proxy(request: NextRequest, path: string, method: string, body?: unknown) {
  const authHeader = request.headers.get('Authorization') ?? ''
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') || '50'
  const offset = searchParams.get('offset') || '0'
  return proxy(request, `/sessions/?limit=${limit}&offset=${offset}`, 'GET')
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return proxy(request, '/sessions/', 'POST', body)
}
