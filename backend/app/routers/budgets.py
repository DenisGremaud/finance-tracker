from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetRead, BudgetStatus, BudgetUpdate

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetRead])
def list_budgets(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Budget]:
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    if month is not None:
        query = query.filter(Budget.month == month)
    if year is not None:
        query = query.filter(Budget.year == year)
    return query.all()


@router.post("", response_model=BudgetRead, status_code=status.HTTP_201_CREATED)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Budget:
    category = (
        db.query(Category)
        .filter(Category.id == payload.category_id, Category.user_id == current_user.id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    existing = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category_id == payload.category_id,
            Budget.month == payload.month,
            Budget.year == payload.year,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget already exists for this category and period",
        )

    budget = Budget(
        user_id=current_user.id,
        category_id=payload.category_id,
        month=payload.month,
        year=payload.year,
        amount=payload.amount,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def _get_owned_budget(db: Session, current_user: User, budget_id: int) -> Budget:
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == current_user.id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


@router.put("/{budget_id}", response_model=BudgetRead)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Budget:
    budget = _get_owned_budget(db, current_user, budget_id)
    if payload.amount is not None:
        budget.amount = payload.amount
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    budget = _get_owned_budget(db, current_user, budget_id)
    db.delete(budget)
    db.commit()


@router.get("/status", response_model=list[BudgetStatus])
def budgets_status(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BudgetStatus]:
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id, Budget.month == month, Budget.year == year)
        .all()
    )

    spent_rows = (
        db.query(Expense.category_id, func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            Expense.user_id == current_user.id,
            func.extract("month", Expense.date) == month,
            func.extract("year", Expense.date) == year,
        )
        .group_by(Expense.category_id)
        .all()
    )
    spent_by_category = {category_id: total for category_id, total in spent_rows}

    result = []
    for budget in budgets:
        spent = Decimal(spent_by_category.get(budget.category_id, 0))
        remaining = budget.amount - spent
        result.append(
            BudgetStatus(
                id=budget.id,
                category_id=budget.category_id,
                category=budget.category,
                month=budget.month,
                year=budget.year,
                amount=budget.amount,
                spent=spent,
                remaining=remaining,
                is_over=spent > budget.amount,
            )
        )
    return result
