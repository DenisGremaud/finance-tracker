const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const TOKEN_KEY = "ft_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number | undefined>
  form?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params, form = false } = options

  const url = new URL(`${API_BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let requestBody: BodyInit | undefined
  if (body !== undefined) {
    if (form) {
      requestBody = body as BodyInit
    } else {
      headers["Content-Type"] = "application/json"
      requestBody = JSON.stringify(body)
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: requestBody,
  })

  if (response.status === 401) {
    clearToken()
    if (window.location.hash !== "#/login") {
      window.location.hash = "#/login"
    }
    throw new ApiError(401, "Unauthorized")
  }

  if (!response.ok) {
    let detail = response.statusText
    try {
      const data = await response.json()
      if (typeof data.detail === "string") {
        detail = data.detail
      } else if (Array.isArray(data.detail)) {
        // FastAPI validation error format: [{ msg: "Value error, ...", ... }, ...]
        detail =
          data.detail
            .map((e: { msg?: string }) => e.msg?.replace(/^Value error,\s*/, ""))
            .filter(Boolean)
            .join(", ") || detail
      }
    } catch {
      // ignore body parse failure
    }
    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
