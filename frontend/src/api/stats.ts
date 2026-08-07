import { apiRequest } from "@/api/client"
import type { CategoryTotal, DashboardSummary, MonthTotal } from "@/types"

export function statsByCategory(month?: number, year?: number) {
  return apiRequest<CategoryTotal[]>("/stats/by-category", { params: { month, year } })
}

export function statsByMonth(year?: number) {
  return apiRequest<MonthTotal[]>("/stats/by-month", { params: { year } })
}

export function statsDashboard() {
  return apiRequest<DashboardSummary>("/stats/dashboard")
}
