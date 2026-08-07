from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.user import User
from app.schemas.stats import CategoryTotal, DashboardSummary, MonthTotal

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/by-category", response_model=list[CategoryTotal])
def stats_by_category(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryTotal]:
    query = (
        db.query(
            Category.id,
            Category.name,
            Category.color,
            func.coalesce(func.sum(Expense.amount), 0).label("total"),
        )
        .join(Expense, Expense.category_id == Category.id)
        .filter(Expense.user_id == current_user.id)
    )
    if month is not None:
        query = query.filter(func.extract("month", Expense.date) == month)
    if year is not None:
        query = query.filter(func.extract("year", Expense.date) == year)

    rows = query.group_by(Category.id, Category.name, Category.color).order_by(func.sum(Expense.amount).desc()).all()

    return [
        CategoryTotal(category_id=row.id, category_name=row.name, color=row.color, total=row.total)
        for row in rows
    ]


@router.get("/by-month", response_model=list[MonthTotal])
def stats_by_month(
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MonthTotal]:
    query = db.query(
        func.extract("month", Expense.date).label("month"),
        func.extract("year", Expense.date).label("year"),
        func.coalesce(func.sum(Expense.amount), 0).label("total"),
    ).filter(Expense.user_id == current_user.id)

    if year is not None:
        query = query.filter(func.extract("year", Expense.date) == year)

    rows = (
        query.group_by(func.extract("year", Expense.date), func.extract("month", Expense.date))
        .order_by(func.extract("year", Expense.date), func.extract("month", Expense.date))
        .all()
    )

    return [MonthTotal(month=int(row.month), year=int(row.year), total=row.total) for row in rows]


@router.get("/dashboard", response_model=DashboardSummary)
def stats_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    today = date.today()

    month_query = db.query(
        func.coalesce(func.sum(Expense.amount), 0), func.count(Expense.id)
    ).filter(
        Expense.user_id == current_user.id,
        func.extract("month", Expense.date) == today.month,
        func.extract("year", Expense.date) == today.year,
    )
    current_month_total, current_month_count = month_query.one()

    spent_rows = (
        db.query(Expense.category_id, func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            Expense.user_id == current_user.id,
            func.extract("month", Expense.date) == today.month,
            func.extract("year", Expense.date) == today.year,
        )
        .group_by(Expense.category_id)
        .all()
    )
    spent_by_category = {category_id: Decimal(total) for category_id, total in spent_rows}

    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id, Budget.month == today.month, Budget.year == today.year)
        .all()
    )
    budgets_over_count = sum(
        1 for budget in budgets if spent_by_category.get(budget.category_id, Decimal(0)) > budget.amount
    )

    top_rows = (
        db.query(
            Category.id,
            Category.name,
            Category.color,
            func.coalesce(func.sum(Expense.amount), 0).label("total"),
        )
        .join(Expense, Expense.category_id == Category.id)
        .filter(
            Expense.user_id == current_user.id,
            func.extract("month", Expense.date) == today.month,
            func.extract("year", Expense.date) == today.year,
        )
        .group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(Expense.amount).desc())
        .limit(5)
        .all()
    )
    top_categories = [
        CategoryTotal(category_id=row.id, category_name=row.name, color=row.color, total=row.total)
        for row in top_rows
    ]

    return DashboardSummary(
        current_month_total=current_month_total,
        current_month_count=current_month_count,
        budgets_over_count=budgets_over_count,
        top_categories=top_categories,
    )
