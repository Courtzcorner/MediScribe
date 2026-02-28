// Use Next.js proxy (/api/backend) to avoid CORS and "Failed to fetch" from direct backend calls.
// Set NEXT_PUBLIC_API_BASE=http://localhost:8000 to bypass proxy and call backend directly.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE || '/api/backend'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function normalizeRequestBody(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeRequestBody)
  if (!isPlainObject(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => [toSnakeCase(key), normalizeRequestBody(val)]),
  )
}

function normalizeResponseBody(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeResponseBody)
  if (!isPlainObject(value)) return value

  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => [toCamelCase(key), normalizeResponseBody(val)]),
  )
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(normalizeRequestBody(body)) : undefined,
    ...rest,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  const json = await res.json()
  return normalizeResponseBody(json) as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: 'POST', body, ...options }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: 'PATCH', body, ...options }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: 'DELETE', ...options }),

  /** Upload a file via multipart/form-data */
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(error.detail || `HTTP ${res.status}`)
    }
    return res.json()
  },
}
