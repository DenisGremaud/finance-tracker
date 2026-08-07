from datetime import date as _date
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.category import CategoryRead


class ExpenseCreate(BaseModel):
    amount: Decimal
    description: str
    date: _date
    category_id: int | None = None


class ExpenseUpdate(BaseModel):
    amount: Decimal | None = None
    description: str | None = None
    date: _date | None = None
    category_id: int | None = None


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: Decimal
    description: str
    date: _date
    category_id: int | None
    category: CategoryRead | None
    created_at: datetime
