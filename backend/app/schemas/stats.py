from decimal import Decimal

from pydantic import BaseModel


class CategoryTotal(BaseModel):
    category_id: int | None
    category_name: str
    color: str | None
    total: Decimal


class MonthTotal(BaseModel):
    month: int
    year: int
    total: Decimal


class DashboardSummary(BaseModel):
    current_month_total: Decimal
    current_month_count: int
    budgets_over_count: int
    top_categories: list[CategoryTotal]
