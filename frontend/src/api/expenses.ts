import { apiRequest } from "@/api/client"
import type { Expense } from "@/types"

export interface ExpenseFilters {
  category_id?: number
  date_from?: string
  date_to?: string
  [key: string]: string | number | undefined
}

export function listExpenses(filters: ExpenseFilters = {}) {
  return apiRequest<Expense[]>("/expenses", { params: filters })
}

export interface ExpenseInput {
  amount: string
  description: string
  date: string
  category_id: number | null
}

export function createExpense(data: ExpenseInput) {
  return apiRequest<Expense>("/expenses", { method: "POST", body: data })
}

export function updateExpense(id: number, data: Partial<ExpenseInput>) {
  return apiRequest<Expense>(`/expenses/${id}`, { method: "PUT", body: data })
}

export function deleteExpense(id: number) {
  return apiRequest<void>(`/expenses/${id}`, { method: "DELETE" })
}
