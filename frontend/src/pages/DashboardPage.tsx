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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
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

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  isLoading,
}: {
  label: string
  value: string
  icon: typeof Receipt
  hint?: React.ReactNode
  tone?: "default" | "danger"
  isLoading: boolean
}) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="space-y-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Icon className="size-4" />
          {label}
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className={cn("num text-2xl font-semibold", tone === "danger" && "text-destructive")}>
            {value}
          </p>
        )}
        {!isLoading && hint && <div className="text-xs">{hint}</div>}
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
  const budgetPercent = totalBudget > 0 ? Math.min((budgetSpent / totalBudget) * 100, 100) : 0

  const topCategories = (summary?.top_categories ?? []).map((c, index) => ({
    label: c.category_name,
    value: Number(c.total),
    color: c.color || CHART_PALETTE[index % CHART_PALETTE.length],
  }))

  const hasAnyData = monthTotals.length > 0 || topCategories.length > 0

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tableau de bord"
        actions={
          <Button asChild>
            <Link to="/expenses">
              <Plus className="size-4" />
              Ajouter une dépense
            </Link>
          </Button>
        }
      />

      {/* Hero: the one number worth seeing first. */}
      <div
        // Fixed gradient rather than var(--primary): the dark palette lightens
        // primary, which would flip this card to dark-on-light and lose the
        // white-text contrast it is designed around.
        className="relative overflow-hidden rounded-xl p-6 text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.53 0.2 277), oklch(0.46 0.22 315))",
        }}
      >
        <div
          aria-hidden
          className="absolute -top-16 -right-10 size-48 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, white, transparent 70%)" }}
        />
        <div className="relative space-y-1">
          <p className="text-sm opacity-80">
            Dépenses en {monthLabel(currentMonth, false).toLowerCase()} {currentYear}
          </p>
          {isLoading ? (
            <Skeleton className="h-11 w-48 bg-white/20" />
          ) : (
            <p className="num text-4xl font-semibold">{formatCurrency(thisMonth)}</p>
          )}

          {!isLoading && delta !== null && (
            <p className="flex items-center gap-1 text-sm opacity-90">
              {delta > 0 ? (
                <ArrowUpRight className="size-4" />
              ) : (
                <ArrowDownRight className="size-4" />
              )}
              <span className="font-medium">{Math.abs(Math.round(delta))}%</span>
              <span className="opacity-80">par rapport au mois dernier</span>
            </p>
          )}

          {!isLoading && totalBudget > 0 && (
            <div className="space-y-1.5 pt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <p className="num text-xs opacity-80">
                {formatCurrency(budgetSpent)} sur {formatCurrency(totalBudget)} budgétés
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          isLoading={isLoading}
          label="Nombre de dépenses"
          icon={Receipt}
          value={String(summary?.current_month_count ?? 0)}
        />
        <StatCard
          isLoading={isLoading}
          label="Budgets dépassés"
          icon={TriangleAlert}
          tone={summary && summary.budgets_over_count > 0 ? "danger" : "default"}
          value={String(summary?.budgets_over_count ?? 0)}
          hint={
            summary && summary.budgets_over_count > 0 ? (
              <Link to="/budgets" className="text-primary font-medium hover:underline">
                Voir les budgets
              </Link>
            ) : (
              <span className="text-muted-foreground">Tout est sous contrôle</span>
            )
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
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
                  <Button asChild size="sm" variant="outline">
                    <Link to="/expenses">Ajouter une dépense</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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
                  <Button asChild size="sm" variant="outline">
                    <Link to="/categories">Créer une catégorie</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
