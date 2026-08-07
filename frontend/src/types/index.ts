export interface User {
  id: number
  email: string
  full_name: string | null
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface RegisterResponse {
  user: User
  token: Token
}

export interface Category {
  id: number
  name: string
  color: string | null
  created_at: string
}

export interface Expense {
  id: number
  amount: string
  description: string
  date: string
  category_id: number | null
  category: Category | null
  created_at: string
}

export interface Budget {
  id: number
  category_id: number
  category: Category
  month: number
  year: number
  amount: string
}

export interface BudgetStatus extends Budget {
  spent: string
  remaining: string
  is_over: boolean
}

export interface CategoryTotal {
  category_id: number | null
  category_name: string
  color: string | null
  total: string
}

export interface MonthTotal {
  month: number
  year: number
  total: string
}

export interface DashboardSummary {
  current_month_total: string
  current_month_count: number
  budgets_over_count: number
  top_categories: CategoryTotal[]
}
