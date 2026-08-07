import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, List, Tag, Wallet, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
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
          <nav className="flex items-center gap-1">
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={logout} title="Déconnexion">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
