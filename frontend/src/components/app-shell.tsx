import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, List, LogOut, Menu, Tag, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { BrandMark } from "@/components/brand-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/state/AuthContext"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/expenses", label: "Dépenses", icon: List },
  { to: "/categories", label: "Catégories", icon: Tag },
  { to: "/budgets", label: "Budgets", icon: Wallet },
]

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-[0.9375rem] leading-none font-semibold tracking-tight">
        Finance Tracker
      </span>
    </Link>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function UserFooter() {
  const { user, logout } = useAuth()
  const initial = user?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <div className="flex items-center gap-2.5 border-t p-3">
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user?.full_name || "Mon compte"}</p>
        <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
      </div>
      <ThemeToggle />
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        title="Déconnexion"
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <LogOut className="size-4" />
        <span className="sr-only">Déconnexion</span>
      </Button>
    </div>
  )
}

export function DesktopSidebar() {
  return (
    <aside className="bg-surface fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
      <div className="flex h-14 items-center px-4">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks />
      </div>
      <UserFooter />
    </aside>
  )
}

export function MobileTopbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-background/85 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="-ml-2">
            <Menu className="size-5" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Accéder aux différentes sections de l'application
          </SheetDescription>
          <div className="flex h-14 items-center border-b px-4">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <UserFooter />
        </SheetContent>
      </Sheet>
      <Brand />
    </header>
  )
}
