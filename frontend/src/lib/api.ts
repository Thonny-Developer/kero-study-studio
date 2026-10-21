// Клиент бэкенда. В dev запросы идут через прокси Vite, в проде — на VITE_API_URL.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
  }
}

let token: string | null = null
let onAuthLost: () => void = () => {}

export function setToken(t: string | null) {
  token = t
}

export function onUnauthorized(fn: () => void) {
  onAuthLost = fn
}

const tz = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
})()

export async function api<T>(path: string, init: { method?: string; body?: unknown; timeout?: number } = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Timezone': tz }
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(BASE + path, {
      method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(init.timeout ?? 20_000),
    })
  } catch (e) {
    const timeout = e instanceof DOMException && e.name === 'TimeoutError'
    throw new ApiError(0, timeout ? 'Сервер долго не отвечает' : 'Нет связи с сервером', 'network')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new ApiError(res.status, data?.error ?? `Ошибка ${res.status}`, data?.code)
    if (res.status === 401 && data?.code === 'auth') onAuthLost()
    throw err
  }
  return data as T
}

/** Абсолютная ссылка на ресурс бэкенда (публичные страницы проектов) */
export function backendUrl(path: string) {
  return (BASE || window.location.origin) + path
}
