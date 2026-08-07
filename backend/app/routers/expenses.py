from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.category import Category
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseRead, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["expenses"])


def _validate_category(db: Session, current_user: User, category_id: int | None) -> None:
    if category_id is None:
        return
    exists = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == current_user.id)
        .first()
    )
    if not exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")


@router.get("", response_model=list[ExpenseRead])
def list_expenses(
    category_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Expense]:
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if category_id is not None:
        query = query.filter(Expense.category_id == category_id)
    if date_from is not None:
        query = query.filter(Expense.date >= date_from)
    if date_to is not None:
        query = query.filter(Expense.date <= date_to)
    return query.order_by(Expense.date.desc(), Expense.id.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Expense:
    _validate_category(db, current_user, payload.category_id)
    expense = Expense(
        user_id=current_user.id,
        amount=payload.amount,
        description=payload.description,
        date=payload.date,
        category_id=payload.category_id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def _get_owned_expense(db: Session, current_user: User, expense_id: int) -> Expense:
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Expense:
    return _get_owned_expense(db, current_user, expense_id)


@router.put("/{expense_id}", response_model=ExpenseRead)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Expense:
    expense = _get_owned_expense(db, current_user, expense_id)
    if payload.category_id is not None:
        _validate_category(db, current_user, payload.category_id)
        expense.category_id = payload.category_id
    if payload.amount is not None:
        expense.amount = payload.amount
    if payload.description is not None:
        expense.description = payload.description
    if payload.date is not None:
        expense.date = payload.date
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    expense = _get_owned_expense(db, current_user, expense_id)
    db.delete(expense)
    db.commit()
