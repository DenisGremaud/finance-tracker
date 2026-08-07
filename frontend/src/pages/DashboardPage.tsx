import { useEffect, useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import * as statsApi from "@/api/stats"
import type { DashboardSummary, MonthTotal } from "@/types"

const PALETTE = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#0ea5e9", "#eab308"]

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [monthTotals, setMonthTotals] = useState<MonthTotal[]>([])

  useEffect(() => {
    statsApi.statsDashboard().then(setSummary)
    statsApi.statsByMonth(new Date().getFullYear()).then(setMonthTotals)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Dépenses ce mois-ci</CardDescription>
            <CardTitle className="text-2xl">
              {summary ? `${Number(summary.current_month_total).toFixed(2)} €` : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Nombre de dépenses</CardDescription>
            <CardTitle className="text-2xl">{summary?.current_month_count ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Budgets dépassés</CardDescription>
            <CardTitle className="text-2xl">{summary?.budgets_over_count ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dépenses par mois ({new Date().getFullYear()})</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={monthTotals.map((m) => ({ label: String(m.month), value: Number(m.total) }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top catégories ce mois-ci</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={(summary?.top_categories ?? []).map((c, index) => ({
                label: c.category_name,
                value: Number(c.total),
                color: c.color || PALETTE[index % PALETTE.length],
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
