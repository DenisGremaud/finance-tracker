import { HashRouter, Navigate, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/state/AuthContext"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { AppLayout } from "@/routes/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ExpensesPage } from "@/pages/ExpensesPage"
import { CategoriesPage } from "@/pages/CategoriesPage"
import { BudgetsPage } from "@/pages/BudgetsPage"

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
