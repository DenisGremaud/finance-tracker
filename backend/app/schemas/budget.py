from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.category import CategoryRead


class BudgetCreate(BaseModel):
    category_id: int
    month: int
    year: int
    amount: Decimal


class BudgetUpdate(BaseModel):
    amount: Decimal | None = None


class BudgetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    category: CategoryRead
    month: int
    year: int
    amount: Decimal


class BudgetStatus(BaseModel):
    id: int
    category_id: int
    category: CategoryRead
    month: int
    year: int
    amount: Decimal
    spent: Decimal
    remaining: Decimal
    is_over: bool
