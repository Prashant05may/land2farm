from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.models.land import Land, LandCreate, LandORM
from app.models.user import UserORM
from app.utils.auth import require_role

router = APIRouter(prefix="/lands", tags=["lands"])


@router.post("", response_model=Land, status_code=status.HTTP_201_CREATED)
def create_land(
    payload: LandCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(require_role("landlord")),
):
    if current_user.id != payload.landlord_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only publish land for your own landlord account.",
        )

    if payload.lease_duration == "less-than-1":
        if payload.availability_period not in settings.allowed_lease_cycles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Availability period must be one of: {', '.join(settings.allowed_lease_cycles)}.",
            )
    else:
        if payload.start_month not in settings.allowed_start_months:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start month is required for leases of one year or more.",
            )

    land = LandORM(**payload.model_dump())
    db.add(land)
    db.commit()
    db.refresh(land)
    return land


@router.get("", response_model=list[Land])
def list_lands(
    location: str | None = Query(default=None),
    available_only: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    query = select(LandORM)
    if location:
        query = query.where(LandORM.location.ilike(f"%{location}%"))
    if available_only:
        query = query.where(LandORM.is_available.is_(True))
    return db.scalars(query.order_by(LandORM.id)).all()
