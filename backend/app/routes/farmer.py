from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.models.booking import Booking, BookingCreate, BookingORM
from app.models.crop import Crop, CropCreate, CropORM
from app.models.land import LandORM
from app.models.user import UserORM
from app.utils.auth import require_role

router = APIRouter(prefix="/farmers", tags=["farmers"])


@router.post("/bookings", response_model=Booking, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(require_role("farmer")),
):
    if current_user.id != payload.farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create bookings for your own farmer account.",
        )

    land = db.scalar(select(LandORM).where(LandORM.id == payload.land_id))
    if land is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land not found.",
        )
    if not land.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This land is already booked.",
        )
    if payload.acres_requested > land.total_acres:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested acres exceed available land.",
        )
    if payload.lease_cycle not in settings.allowed_lease_cycles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lease cycle must be one of: {', '.join(settings.allowed_lease_cycles)}.",
        )

    booking = BookingORM(**payload.model_dump())
    db.add(booking)
    land.is_available = False
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/bookings", response_model=list[Booking])
def list_bookings(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(require_role("farmer", "landlord", "industry")),
):
    query = select(BookingORM)
    if current_user.role == "farmer":
        query = query.where(BookingORM.farmer_id == current_user.id)
    return db.scalars(query.order_by(BookingORM.id)).all()


@router.post("/crops", response_model=Crop, status_code=status.HTTP_201_CREATED)
def create_crop(
    payload: CropCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(require_role("farmer")),
):
    if current_user.id != payload.farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only publish crops for your own farmer account.",
        )

    if payload.land_id is not None:
        land = db.scalar(select(LandORM).where(LandORM.id == payload.land_id))
        if land is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Referenced land not found.",
            )

    crop = CropORM(**payload.model_dump())
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop


@router.get("/crops", response_model=list[Crop])
def list_crops(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(require_role("farmer", "landlord", "industry")),
):
    query = select(CropORM)
    if current_user.role == "farmer":
        query = query.where(CropORM.farmer_id == current_user.id)
    return db.scalars(query.order_by(CropORM.id)).all()
