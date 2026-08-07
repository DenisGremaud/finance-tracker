import { apiRequest } from "@/api/client"
import type { RegisterResponse, Token, User } from "@/types"

export function register(email: string, password: string, fullName?: string) {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    body: { email, password, full_name: fullName || null },
  })
}

export function login(email: string, password: string) {
  const form = new URLSearchParams()
  form.set("username", email)
  form.set("password", password)
  return apiRequest<Token>("/auth/login", {
    method: "POST",
    body: form,
    form: true,
  })
}

export function me() {
  return apiRequest<User>("/auth/me")
}
