import { useEffect, useState, type FormEvent } from "react"
import { MoreHorizontal, Pencil, Plus, Tag, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import * as categoriesApi from "@/api/categories"
import { ApiError } from "@/api/client"
import type { Category } from "@/types"
import { cn } from "@/lib/utils"

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
]

interface CategoryFormProps {
  initial?: Category
  onSubmit: (name: string, color: string) => Promise<void>
  onCancel: () => void
}

function CategoryForm({ initial, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit(name, color)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alimentation, transport..."
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Couleur</Label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              aria-label={`Couleur ${preset}`}
              aria-pressed={color.toLowerCase() === preset}
              className={cn(
                "size-7 rounded-full transition-transform",
                color.toLowerCase() === preset
                  ? "ring-ring ring-offset-background scale-110 ring-2 ring-offset-2"
                  : "hover:scale-110"
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
          <label className="border-input ml-1 flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="size-10 cursor-pointer border-0 bg-transparent p-0"
              aria-label="Couleur personnalisée"
            />
          </label>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<Category | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)

  async function load() {
    setIsLoading(true)
    try {
      setCategories(await categoriesApi.listCategories())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => undefined)
  }, [])

  async function handleSubmit(name: string, color: string) {
    if (editing) {
      await categoriesApi.updateCategory(editing.id, { name, color })
    } else {
      await categoriesApi.createCategory(name, color)
    }
    setIsFormOpen(false)
    await load()
  }

  async function handleDelete() {
    if (!pendingDelete) return
    await categoriesApi.deleteCategory(pendingDelete.id)
    await load()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catégories"
        description="Classez vos dépenses pour suivre où part votre argent."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined)
              setIsFormOpen(true)
            }}
          >
            <Plus className="size-4" />
            Nouvelle catégorie
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card className="py-0">
          <EmptyState
            icon={Tag}
            title="Aucune catégorie"
            description="Créez des catégories comme « Alimentation » ou « Transport » pour organiser vos dépenses."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditing(undefined)
                  setIsFormOpen(true)
                }}
              >
                <Plus className="size-4" />
                Nouvelle catégorie
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="flex-row items-center gap-3 px-4 py-3.5 transition-shadow hover:shadow-sm"
            >
              <CategoryDot color={category.color} className="size-3" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground -mr-2 size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(category)
                      setIsFormOpen(true)
                    }}
                  >
                    <Pencil className="size-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPendingDelete(category)} variant="destructive">
                    <Trash2 className="size-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            key={editing?.id ?? "new"}
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Supprimer cette catégorie ?"
        description={
          pendingDelete
            ? `« ${pendingDelete.name} » sera supprimée. Les dépenses associées seront conservées, sans catégorie.`
            : undefined
        }
        onConfirm={handleDelete}
      />
    </div>
  )
}
