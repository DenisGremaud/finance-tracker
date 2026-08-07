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
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { BarChart } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import * as statsApi from "@/api/stats"
import type { DashboardSummary, MonthTotal } from "@/types"
import { MONTHS_SHORT, formatCurrency, monthLabel } from "@/lib/format"
import { cn } from "@/lib/utils"

const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface StatCardProps {
  label: string
  value: string
  icon: typeof Receipt
  hint?: React.ReactNode
  tone?: "default" | "danger"
  isLoading: boolean
}

function StatCard({ label, value, icon: Icon, hint, tone = "default", isLoading }: StatCardProps) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="space-y-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Icon className="size-4" />
          {label}
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p
            className={cn(
              "num text-2xl font-semibold",
              tone === "danger" && "text-destructive"
            )}
          >
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
  const [isLoading, setIsLoading] = useState(true)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  useEffect(() => {
    Promise.all([statsApi.statsDashboard(), statsApi.statsByMonth(currentYear)])
      .then(([dashboard, months]) => {
        setSummary(dashboard)
        setMonthTotals(months)
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false))
  }, [currentYear])

  // The API only returns months that have expenses; pad to a full year so the
  // chart reads as a calendar rather than a couple of floating bars.
  const totalsByMonth = new Map(monthTotals.map((m) => [m.month, Number(m.total)]))
  const chartData = MONTHS_SHORT.map((label, index) => ({
    label,
    value: totalsByMonth.get(index + 1) ?? 0,
    highlighted: index + 1 === currentMonth,
  }))

  const thisMonth = totalsByMonth.get(currentMonth) ?? 0
  const lastMonth = currentMonth > 1 ? (totalsByMonth.get(currentMonth - 1) ?? 0) : 0
  const delta = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null

  const topCategories = (summary?.top_categories ?? []).map((c, index) => ({
    label: c.category_name,
    value: Number(c.total),
    color: c.color || CHART_PALETTE[index % CHART_PALETTE.length],
  }))

  const hasAnyData = monthTotals.length > 0 || topCategories.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={`${monthLabel(currentMonth, false)} ${currentYear}`}
        actions={
          <Button asChild>
            <Link to="/expenses">
              <Plus className="size-4" />
              Ajouter une dépense
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          isLoading={isLoading}
          label="Dépenses ce mois-ci"
          icon={Wallet}
          value={formatCurrency(summary?.current_month_total ?? 0)}
          hint={
            delta !== null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  delta > 0 ? "text-destructive" : "text-success"
                )}
              >
                {delta > 0 ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {Math.abs(Math.round(delta))}%
                <span className="text-muted-foreground font-normal">vs mois dernier</span>
              </span>
            )
          }
        />
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
