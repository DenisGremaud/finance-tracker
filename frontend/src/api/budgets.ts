import { apiRequest } from "@/api/client"
import type { Budget, BudgetStatus } from "@/types"

export function listBudgets(month?: number, year?: number) {
  return apiRequest<Budget[]>("/budgets", { params: { month, year } })
}

export function createBudget(data: { category_id: number; month: number; year: number; amount: string }) {
  return apiRequest<Budget>("/budgets", { method: "POST", body: data })
}

export function updateBudget(id: number, amount: string) {
  return apiRequest<Budget>(`/budgets/${id}`, { method: "PUT", body: { amount } })
}

export function deleteBudget(id: number) {
  return apiRequest<void>(`/budgets/${id}`, { method: "DELETE" })
}

export function budgetsStatus(month: number, year: number) {
  return apiRequest<BudgetStatus[]>("/budgets/status", { params: { month, year } })
}
