from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.crop import Crop, CropORM
from app.models.order import Order, OrderCreate, OrderORM
from app.models.user import UserORM
from app.utils.auth import require_role

router = APIRouter(prefix="/industries", tags=["industries"])


@router.get("/crops")
def browse_crops(
    crop_name: str | None = Query(default=None),
    min_expected_yield: float | None = Query(default=None, ge=0),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(require_role("industry")),
) -> list[Crop]:
    query = select(CropORM)
    if crop_name:
        query = query.where(CropORM.name.ilike(f"%{crop_name}%"))
    if min_expected_yield is not None:
        query = query.where(CropORM.expected_yield_tons >= min_expected_yield)
    return db.scalars(query.order_by(CropORM.id)).all()


@router.post("/orders", response_model=Order)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(require_role("industry")),
):
    if current_user.id != payload.industry_id:
        raise HTTPException(
            status_code=403,
            detail="You can only create crop orders for your own industry account.",
        )

    crop = db.scalar(select(CropORM).where(CropORM.id == payload.crop_id))
    if crop is None:
        raise HTTPException(status_code=404, detail="Crop not found.")

    order = OrderORM(**payload.model_dump())
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders", response_model=list[Order])
def list_orders(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(require_role("industry")),
):
    query = select(OrderORM).where(OrderORM.industry_id == current_user.id)
    return db.scalars(query.order_by(OrderORM.id)).all()
