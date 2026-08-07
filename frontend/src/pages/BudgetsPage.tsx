import { useEffect, useState, type FormEvent } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { CategoryChip } from "@/components/category-chip"
import { ConfirmDialog } from "@/components/confirm-dialog"
import * as budgetsApi from "@/api/budgets"
import * as categoriesApi from "@/api/categories"
import { ApiError } from "@/api/client"
import type { BudgetStatus, Category } from "@/types"
import { formatCurrency, monthLabel } from "@/lib/format"

function progressTone(percent: number, isOver: boolean) {
  if (isOver) return "bg-destructive"
  if (percent >= 80) return "bg-warning"
  return "bg-primary"
}

export function BudgetsPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const [statuses, setStatuses] = useState<BudgetStatus[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<BudgetStatus | null>(null)

  async function load() {
    setIsLoading(true)
    try {
      setStatuses(await budgetsApi.budgetsStatus(month, year))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    categoriesApi.listCategories().then(setCategories).catch(() => undefined)
  }, [])

  useEffect(() => {
    load().catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year])

  function shiftMonth(direction: -1 | 1) {
    const next = new Date(year, month - 1 + direction, 1)
    setMonth(next.getMonth() + 1)
    setYear(next.getFullYear())
  }

  const budgetedCategoryIds = new Set(statuses.map((s) => s.category_id))
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id))

  const totalBudget = statuses.reduce((sum, s) => sum + Number(s.amount), 0)
  const totalSpent = statuses.reduce((sum, s) => sum + Number(s.spent), 0)
  const overallPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await budgetsApi.createBudget({
        category_id: Number(categoryId),
        month,
        year,
        amount,
      })
      setCategoryId("")
      setAmount("")
      setIsFormOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    await budgetsApi.deleteBudget(pendingDelete.id)
    await load()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Fixez une limite mensuelle par catégorie et suivez votre progression."
        actions={
          <Button onClick={() => setIsFormOpen(true)} disabled={availableCategories.length === 0}>
            <Plus className="size-4" />
            Ajouter
          </Button>
        }
      />

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
          <ChevronLeft className="size-4" />
          <span className="sr-only">Mois précédent</span>
        </Button>
        <span className="min-w-40 text-center text-sm font-medium">
          {monthLabel(month, false)} {year}
        </span>
        <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
          <ChevronRight className="size-4" />
          <span className="sr-only">Mois suivant</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : statuses.length === 0 ? (
        <Card className="py-0">
          <EmptyState
            icon={Wallet}
            title="Aucun budget pour ce mois"
            description={
              categories.length === 0
                ? "Créez d'abord une catégorie, puis fixez-lui un budget mensuel."
                : "Fixez une limite par catégorie pour être alerté en cas de dépassement."
            }
            action={
              availableCategories.length > 0 ? (
                <Button size="sm" onClick={() => setIsFormOpen(true)}>
                  <Plus className="size-4" />
                  Ajouter un budget
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <Card className="gap-0 py-5">
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground text-sm">Total du mois</span>
                <span className="num text-sm">
                  <span className="text-foreground font-semibold">
                    {formatCurrency(totalSpent)}
                  </span>
                  <span className="text-muted-foreground"> / {formatCurrency(totalBudget)}</span>
                </span>
              </div>
              <Progress
                value={overallPercent}
                indicatorClassName={progressTone(overallPercent, totalSpent > totalBudget)}
              />
            </CardContent>
          </Card>

          <div className="space-y-3">
            {statuses.map((status) => {
              const spent = Number(status.spent)
              const limit = Number(status.amount)
              const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
              const remaining = Number(status.remaining)

              return (
                <Card key={status.id} className="gap-0 py-4">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <CategoryChip
                          name={status.category.name}
                          color={status.category.color}
                          className="min-w-0 text-sm"
                        />
                        {status.is_over && (
                          <Badge variant="destructive" className="shrink-0">
                            Dépassé
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(status)}
                        className="text-muted-foreground hover:text-destructive -mt-1 -mr-2 size-8 shrink-0"
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>

                    <Progress
                      value={percent}
                      indicatorClassName={progressTone(percent, status.is_over)}
                    />

                    <div className="flex items-baseline justify-between text-sm">
                      <span className="num">
                        <span className="font-semibold">{formatCurrency(spent)}</span>
                        <span className="text-muted-foreground"> / {formatCurrency(limit)}</span>
                      </span>
                      <span
                        className={
                          status.is_over
                            ? "text-destructive num text-xs font-medium"
                            : "text-muted-foreground num text-xs"
                        }
                      >
                        {status.is_over
                          ? `${formatCurrency(Math.abs(remaining))} de dépassement`
                          : `${formatCurrency(remaining)} restants`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Budget · {monthLabel(month, false)} {year}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget-category">Catégorie</Label>
              <Select
                id="budget-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Choisir une catégorie
                </option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Limite mensuelle</Label>
              <div className="relative">
                <Input
                  id="budget-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="num pr-7"
                  required
                />
                <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">
                  €
                </span>
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Supprimer ce budget ?"
        description={
          pendingDelete
            ? `Le budget de « ${pendingDelete.category.name} » pour ${monthLabel(month, false)} ${year} sera supprimé.`
            : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  )
}
