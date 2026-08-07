import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, Pencil, Plus, Tag, Trash2, Wallet } from "lucide-react"

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
import { Amount } from "@/components/amount"
import { CategoryIcon } from "@/components/category-icon"
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
  const [editing, setEditing] = useState<BudgetStatus | null>(null)
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

  async function loadCategories() {
    setCategories(await categoriesApi.listCategories())
  }

  useEffect(() => {
    loadCategories().catch(() => undefined)
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

  function openCreate() {
    setEditing(null)
    setCategoryId("")
    setAmount("")
    setError(null)
    // Categories may have been added on another page since this one mounted.
    loadCategories().catch(() => undefined)
    setIsFormOpen(true)
  }

  function openEdit(status: BudgetStatus) {
    setEditing(status)
    setCategoryId(String(status.category_id))
    // The API returns "300.00"; show "300" so the field reads naturally.
    setAmount(String(Number(status.amount)))
    setError(null)
    setIsFormOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      if (editing) {
        await budgetsApi.updateBudget(editing.id, amount)
      } else {
        await budgetsApi.createBudget({
          category_id: Number(categoryId),
          month,
          year,
          amount,
        })
      }
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

  const canPickCategory = editing !== null || availableCategories.length > 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Budgets"
        description="Fixez une limite mensuelle par catégorie et suivez votre progression."
        actions={
          <Button onClick={openCreate}>
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
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : statuses.length === 0 ? (
        <Card className="py-0">
          <EmptyState
            icon={Wallet}
            title="Aucun budget pour ce mois"
            description={
              categories.length === 0
                ? "Un budget s'applique à une catégorie. Créez-en une d'abord."
                : "Fixez une limite par catégorie pour être alerté en cas de dépassement."
            }
            action={
              categories.length === 0 ? (
                <Button asChild size="sm">
                  <Link to="/categories">
                    <Tag className="size-4" />
                    Créer une catégorie
                  </Link>
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4" />
                  Ajouter un budget
                </Button>
              )
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
                    <div className="flex items-center gap-3">
                      <CategoryIcon name={status.category.name} color={status.category.color} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {status.category.name}
                          </span>
                          {status.is_over && (
                            <Badge variant="destructive" className="shrink-0">
                              Dépassé
                            </Badge>
                          )}
                        </div>
                        <p
                          className={
                            status.is_over
                              ? "text-destructive num text-xs"
                              : "text-muted-foreground num text-xs"
                          }
                        >
                          {status.is_over
                            ? `${formatCurrency(Math.abs(remaining))} de dépassement`
                            : `${formatCurrency(remaining)} restants`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Amount value={spent} className="block text-sm font-semibold" />
                        <p className="text-muted-foreground num text-xs">
                          sur {formatCurrency(limit)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(status)}
                          className="text-muted-foreground hover:text-foreground size-8"
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDelete(status)}
                          className="text-muted-foreground hover:text-destructive -mr-1 size-8"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </div>

                    <Progress
                      value={percent}
                      indicatorClassName={progressTone(percent, status.is_over)}
                    />
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
              {editing ? "Modifier le budget" : "Nouveau budget"} · {monthLabel(month, false)}{" "}
              {year}
            </DialogTitle>
          </DialogHeader>

          {/* The button always opens: a disabled button with no explanation is
              a dead end, so the reason lives here instead. */}
          {!canPickCategory ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {categories.length === 0
                  ? "Un budget s'applique à une catégorie, et vous n'en avez pas encore créé."
                  : `Toutes vos catégories ont déjà un budget pour ${monthLabel(month, false).toLowerCase()} ${year}. Modifiez un budget existant, changez de mois, ou créez une nouvelle catégorie.`}
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Fermer
                </Button>
                <Button asChild>
                  <Link to="/categories">
                    <Tag className="size-4" />
                    {categories.length === 0 ? "Créer une catégorie" : "Gérer les catégories"}
                  </Link>
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget-category">Catégorie</Label>
                {editing ? (
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon
                      name={editing.category.name}
                      color={editing.category.color}
                      className="size-8"
                    />
                    <span className="text-sm font-medium">{editing.category.name}</span>
                  </div>
                ) : (
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
                )}
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
                    autoFocus
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
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Supprimer ce budget ?"
        description={
          pendingDelete
            ? `Le budget de « ${pendingDelete.category.name} » pour ${monthLabel(month, false).toLowerCase()} ${year} sera supprimé.`
            : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  )
}
