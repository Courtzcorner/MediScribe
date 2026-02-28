import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const contentType = request.headers.get('Content-Type') ?? ''
  const body = contentType.includes('multipart/form-data')
    ? await request.arrayBuffer().catch(() => new ArrayBuffer(0))
    : await request.text().catch(() => '')
  return proxyRequest(request, params.path, 'POST', body)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const body = await request.text().catch(() => '')
  return proxyRequest(request, params.path, 'PATCH', body)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE')
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string,
  body?: string | ArrayBuffer
) {
  const path = '/' + pathSegments.join('/')
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  const fullPath = queryString ? `${path}?${queryString}` : path

  try {
    const authHeader = request.headers.get('Authorization') ?? ''
    const contentType = request.headers.get('Content-Type') ?? 'application/json'
    
    const res = await fetch(`${BACKEND_URL}${fullPath}`, {
      method,
      headers: {
        'Content-Type': contentType,
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: body instanceof ArrayBuffer && body.byteLength > 0 ? body : (body || undefined),
    })

    const responseText = await res.text()
    let responseData
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    return NextResponse.json(responseData, { status: res.status })
  } catch (error) {
    console.error('Backend proxy error:', error)
    return NextResponse.json(
      { detail: 'Backend service unavailable' },
      { status: 503 }
    )
  }
}