import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expense-form"
import * as expensesApi from "@/api/expenses"
import * as categoriesApi from "@/api/categories"
import type { Category, Expense } from "@/types"

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryFilter, setCategoryFilter] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  async function loadExpenses() {
    setIsLoading(true)
    const data = await expensesApi.listExpenses(
      categoryFilter ? { category_id: Number(categoryFilter) } : {}
    )
    setExpenses(data)
    setIsLoading(false)
  }

  useEffect(() => {
    categoriesApi.listCategories().then(setCategories)
  }, [])

  useEffect(() => {
    loadExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter])

  function openCreateDialog() {
    setEditingExpense(undefined)
    setIsDialogOpen(true)
  }

  function openEditDialog(expense: Expense) {
    setEditingExpense(expense)
    setIsDialogOpen(true)
  }

  async function handleSubmit(data: {
    amount: string
    description: string
    date: string
    category_id: number | null
  }) {
    if (editingExpense) {
      await expensesApi.updateExpense(editingExpense.id, data)
    } else {
      await expensesApi.createExpense(data)
    }
    setIsDialogOpen(false)
    await loadExpenses()
  }

  async function handleDelete(id: number) {
    await expensesApi.deleteExpense(id)
    await loadExpenses()
  }

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dépenses</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-56"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <span className="text-sm text-muted-foreground">Total : {total.toFixed(2)} €</span>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucune dépense pour le moment
                  </TableCell>
                </TableRow>
              )}
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.category?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">{Number(expense.amount).toFixed(2)} €</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Modifier la dépense" : "Nouvelle dépense"}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            categories={categories}
            initial={editingExpense}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
