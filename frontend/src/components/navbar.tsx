import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, List, Menu, Tag, Wallet, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/state/AuthContext"
import { cn } from "@/lib/utils"

const links = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/expenses", label: "Dépenses", icon: List },
  { to: "/categories", label: "Catégories", icon: Tag },
  { to: "/budgets", label: "Budgets", icon: Wallet },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Finance Tracker</span>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  location.pathname === to && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <span className="max-w-40 truncate text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={logout} title="Déconnexion">
            <LogOut className="size-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {links.map(({ to, label, icon: Icon }) => (
              <DropdownMenuItem key={to} asChild>
                <Link
                  to={to}
                  className={cn(
                    "flex items-center gap-2",
                    location.pathname === to && "bg-accent text-accent-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} variant="destructive">
              <LogOut className="size-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
