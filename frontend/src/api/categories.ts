import { apiRequest } from "@/api/client"
import type { Category } from "@/types"

export function listCategories() {
  return apiRequest<Category[]>("/categories")
}

export function createCategory(name: string, color?: string) {
  return apiRequest<Category>("/categories", { method: "POST", body: { name, color } })
}

export function updateCategory(id: number, data: { name?: string; color?: string }) {
  return apiRequest<Category>(`/categories/${id}`, { method: "PUT", body: data })
}

export function deleteCategory(id: number) {
  return apiRequest<void>(`/categories/${id}`, { method: "DELETE" })
}
