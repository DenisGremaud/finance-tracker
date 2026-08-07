import { useEffect, useMemo, useState } from "react"
import { MoreHorizontal, Pencil, Plus, Receipt, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { CategoryDot } from "@/components/category-dot"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ExpenseForm } from "@/components/expense-form"
import * as expensesApi from "@/api/expenses"
import * as categoriesApi from "@/api/categories"
import type { Category, Expense } from "@/types"
import { formatCurrency, formatDate } from "@/lib/format"

type Period = "all" | "this-month" | "last-month" | "this-year"

const PERIOD_LABELS: Record<Period, string> = {
  all: "Toute la période",
  "this-month": "Ce mois-ci",
  "last-month": "Le mois dernier",
  "this-year": "Cette année",
}

function periodRange(period: Period): { date_from?: string; date_to?: string } {
  const now = new Date()
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

  switch (period) {
    case "this-month":
      return {
        date_from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
        date_to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      }
    case "last-month":
      return {
        date_from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        date_to: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
      }
    case "this-year":
      return {
        date_from: iso(new Date(now.getFullYear(), 0, 1)),
        date_to: iso(new Date(now.getFullYear(), 11, 31)),
      }
    default:
      return {}
  }
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} variant="destructive">
          <Trash2 className="size-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryFilter, setCategoryFilter] = useState("")
  const [period, setPeriod] = useState<Period>("all")
  const [isLoading, setIsLoading] = useState(true)

  const [editing, setEditing] = useState<Expense | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null)

  async function loadExpenses() {
    setIsLoading(true)
    try {
      const data = await expensesApi.listExpenses({
        ...(categoryFilter ? { category_id: Number(categoryFilter) } : {}),
        ...periodRange(period),
      })
      setExpenses(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    categoriesApi.listCategories().then(setCategories).catch(() => undefined)
  }, [])

  useEffect(() => {
    loadExpenses().catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, period])

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses]
  )

  function openCreate() {
    setEditing(undefined)
    setIsFormOpen(true)
  }

  function openEdit(expense: Expense) {
    setEditing(expense)
    setIsFormOpen(true)
  }

  async function handleSubmit(data: expensesApi.ExpenseInput) {
    if (editing) {
      await expensesApi.updateExpense(editing.id, data)
    } else {
      await expensesApi.createExpense(data)
    }
    setIsFormOpen(false)
    await loadExpenses()
  }

  async function handleDelete() {
    if (!pendingDelete) return
    await expensesApi.deleteExpense(pendingDelete.id)
    await loadExpenses()
  }

  const isEmpty = !isLoading && expenses.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dépenses"
        description={
          isLoading
            ? undefined
            : `${expenses.length} dépense${expenses.length > 1 ? "s" : ""} · ${formatCurrency(total)}`
        }
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Ajouter
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filtrer par catégorie"
          className="sm:w-52"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          aria-label="Filtrer par période"
          className="sm:w-44"
        >
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            icon={Receipt}
            title="Aucune dépense"
            description={
              categoryFilter || period !== "all"
                ? "Aucune dépense ne correspond à ces filtres."
                : "Commencez par enregistrer votre première dépense."
            }
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                Ajouter une dépense
              </Button>
            }
          />
        ) : (
          <>
            {/* Phone layout: a table would need horizontal scrolling here. */}
            <ul className="divide-y sm:hidden">
              {expenses.map((expense) => (
                <li key={expense.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{expense.description}</p>
                    <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                      {expense.category && <CategoryDot color={expense.category.color} className="size-2" />}
                      <span className="truncate">{expense.category?.name ?? "Sans catégorie"}</span>
                      <span aria-hidden>·</span>
                      <span className="num shrink-0">{formatDate(expense.date)}</span>
                    </p>
                  </div>
                  <span className="num shrink-0 text-sm font-semibold">
                    {formatCurrency(expense.amount)}
                  </span>
                  <RowActions
                    onEdit={() => openEdit(expense)}
                    onDelete={() => setPendingDelete(expense)}
                  />
                </li>
              ))}
            </ul>

            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-muted-foreground num pl-6">
                        {formatDate(expense.date)}
                      </TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        {expense.category ? (
                          <span className="flex items-center gap-2">
                            <CategoryDot color={expense.category.color} />
                            {expense.category.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="num text-right font-semibold">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <RowActions
                          onEdit={() => openEdit(expense)}
                          onDelete={() => setPendingDelete(expense)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la dépense" : "Nouvelle dépense"}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            key={editing?.id ?? "new"}
            categories={categories}
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Supprimer cette dépense ?"
        description={
          pendingDelete
            ? `« ${pendingDelete.description} » (${formatCurrency(pendingDelete.amount)}) sera définitivement supprimée.`
            : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  )
}
