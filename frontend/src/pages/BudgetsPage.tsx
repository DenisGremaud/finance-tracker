import { useEffect, useState, type FormEvent } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as budgetsApi from "@/api/budgets"
import * as categoriesApi from "@/api/categories"
import type { BudgetStatus, Category } from "@/types"
import { ApiError } from "@/api/client"

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

export function BudgetsPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [statuses, setStatuses] = useState<BudgetStatus[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    setIsLoading(true)
    const data = await budgetsApi.budgetsStatus(month, year)
    setStatuses(data)
    setIsLoading(false)
  }

  useEffect(() => {
    categoriesApi.listCategories().then(setCategories)
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await budgetsApi.createBudget({ category_id: Number(categoryId), month, year, amount })
      setCategoryId("")
      setAmount("")
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue")
    }
  }

  async function handleDelete(id: number) {
    await budgetsApi.deleteBudget(id)
    await load()
  }

  const budgetedCategoryIds = new Set(statuses.map((s) => s.category_id))
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <div className="flex items-center gap-2">
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-40">
            {MONTHS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      {availableCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ajouter un budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="budget-category">Catégorie</Label>
                <Select
                  id="budget-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-48"
                  required
                >
                  <option value="" disabled>
                    Choisir...
                  </option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="budget-amount">Montant mensuel</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Ajouter</Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {!isLoading && statuses.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun budget défini pour cette période.</p>
        )}
        {statuses.map((status) => {
          const percent = Number(status.amount) > 0
            ? Math.min(100, (Number(status.spent) / Number(status.amount)) * 100)
            : 0
          return (
            <Card key={status.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ backgroundColor: status.category.color || "#999" }}
                    />
                    <span className="font-medium">{status.category.name}</span>
                    {status.is_over && <Badge variant="destructive">Dépassé</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {Number(status.spent).toFixed(2)} € / {Number(status.amount).toFixed(2)} €
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(status.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <Progress
                  value={percent}
                  indicatorClassName={status.is_over ? "bg-destructive" : undefined}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
