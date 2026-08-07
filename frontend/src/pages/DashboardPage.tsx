import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Plus,
  Receipt,
  TriangleAlert,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { Amount } from "@/components/amount"
import { BarChart } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import * as statsApi from "@/api/stats"
import * as budgetsApi from "@/api/budgets"
import type { BudgetStatus, DashboardSummary, MonthTotal } from "@/types"
import { MONTHS_SHORT, formatCurrency, monthLabel } from "@/lib/format"
import { cn } from "@/lib/utils"

const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function Tile({
  icon: Icon,
  tint,
  label,
  value,
  isLoading,
  tone,
}: {
  icon: typeof Receipt
  tint: string
  label: string
  value: string
  isLoading: boolean
  tone?: "danger"
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="space-y-3 px-4">
        <span
          className="flex size-9 items-center justify-center rounded-[0.75rem] text-white"
          style={{ backgroundColor: tint }}
        >
          <Icon className="size-4.5" />
        </span>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">{label}</p>
          {isLoading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <p className={cn("num text-lg font-semibold", tone === "danger" && "text-destructive")}>
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [monthTotals, setMonthTotals] = useState<MonthTotal[]>([])
  const [budgets, setBudgets] = useState<BudgetStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  useEffect(() => {
    Promise.all([
      statsApi.statsDashboard(),
      statsApi.statsByMonth(currentYear),
      budgetsApi.budgetsStatus(currentMonth, currentYear),
    ])
      .then(([dashboard, months, budgetStatuses]) => {
        setSummary(dashboard)
        setMonthTotals(months)
        setBudgets(budgetStatuses)
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false))
  }, [currentYear, currentMonth])

  // The API only returns months that have expenses; pad to a full year so the
  // chart reads as a calendar rather than a couple of floating bars.
  const totalsByMonth = new Map(monthTotals.map((m) => [m.month, Number(m.total)]))
  const chartData = MONTHS_SHORT.map((label, index) => ({
    label,
    value: totalsByMonth.get(index + 1) ?? 0,
    highlighted: index + 1 === currentMonth,
  }))

  const thisMonth = Number(summary?.current_month_total ?? 0)
  const lastMonth = currentMonth > 1 ? (totalsByMonth.get(currentMonth - 1) ?? 0) : 0
  const delta = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
  const budgetSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0)
  const remaining = totalBudget - budgetSpent

  const topCategories = (summary?.top_categories ?? []).map((c, index) => ({
    label: c.category_name,
    value: Number(c.total),
    color: c.color || CHART_PALETTE[index % CHART_PALETTE.length],
  }))

  const hasAnyData = monthTotals.length > 0 || topCategories.length > 0

  return (
    <div className="space-y-6">
      {/* Hero: the single number worth seeing first, on the bare page. */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            Dépensé en {monthLabel(currentMonth, false).toLowerCase()}
          </span>
          {!isLoading && delta !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                delta > 0
                  ? "bg-destructive/12 text-destructive"
                  : "bg-success/15 text-success"
              )}
            >
              {delta > 0 ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(Math.round(delta))}%
            </span>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-11 w-52" />
        ) : (
          <Amount value={thisMonth} className="block text-4xl font-semibold" />
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild>
            <Link to="/expenses">
              <Plus className="size-4" />
              Ajouter
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/budgets">
              <Wallet className="size-4" />
              Budgets
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dépenses par mois</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : hasAnyData ? (
            <BarChart data={chartData} />
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Aucune dépense cette année"
              description="Ajoutez votre première dépense pour voir apparaître vos statistiques."
              action={
                <Button asChild size="sm">
                  <Link to="/expenses">Ajouter une dépense</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          isLoading={isLoading}
          icon={Receipt}
          tint="var(--chart-1)"
          label="Dépenses"
          value={String(summary?.current_month_count ?? 0)}
        />
        <Tile
          isLoading={isLoading}
          icon={Wallet}
          tint="var(--chart-5)"
          label="Budget total"
          value={formatCurrency(totalBudget)}
        />
        <Tile
          isLoading={isLoading}
          icon={BarChart3}
          tint="var(--chart-2)"
          label="Restant"
          value={formatCurrency(remaining)}
          tone={remaining < 0 ? "danger" : undefined}
        />
        <Tile
          isLoading={isLoading}
          icon={TriangleAlert}
          tint="var(--chart-3)"
          label="Dépassés"
          value={String(summary?.budgets_over_count ?? 0)}
          tone={summary && summary.budgets_over_count > 0 ? "danger" : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition ce mois-ci</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : topCategories.length > 0 ? (
            <DonutChart data={topCategories} />
          ) : (
            <EmptyState
              icon={PieChart}
              title="Pas encore de catégories utilisées"
              description="Classez vos dépenses par catégorie pour voir leur répartition."
              action={
                <Button asChild size="sm">
                  <Link to="/categories">Créer une catégorie</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
