import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, List, LogOut, Tag, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BrandMark } from "@/components/brand-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/state/AuthContext"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "Tableau de bord", short: "Accueil", icon: LayoutDashboard },
  { to: "/expenses", label: "Dépenses", short: "Dépenses", icon: List },
  { to: "/categories", label: "Catégories", short: "Catégories", icon: Tag },
  { to: "/budgets", label: "Budgets", short: "Budgets", icon: Wallet },
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

function AccountMenu() {
  const { user, logout } = useAuth()
  const initial = user?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="bg-card text-foreground flex size-9 items-center justify-center rounded-full text-xs font-semibold">
          {initial}
          <span className="sr-only">Mon compte</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user?.full_name || "Mon compte"}</p>
          <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} variant="destructive">
          <LogOut className="size-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DesktopSidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const initial = user?.email?.[0]?.toUpperCase() ?? "?"

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col px-3 py-4 lg:flex">
      <div className="flex h-12 items-center px-2">
        <Brand />
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2.5 px-2 py-2">
        <span className="bg-card text-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
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
    </aside>
  )
}

export function MobileTopbar() {
  return (
    <header className="bg-background/85 sticky top-0 z-30 flex h-14 items-center justify-between gap-3 px-4 backdrop-blur-md lg:hidden">
      <Brand />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  )
}

export function MobileTabBar() {
  const location = useLocation()

  return (
    <nav
      data-slot="tab-bar"
      className="bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden"
    >
      <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ to, short, icon: Icon }) => {
          const isActive = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.6875rem] transition-colors",
                isActive ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive && "stroke-[2.25]")} />
              {short}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
