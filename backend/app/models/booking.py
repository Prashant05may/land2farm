from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class BookingORM(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    land_id: Mapped[int] = mapped_column(ForeignKey("lands.id"), nullable=False, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    acres_requested: Mapped[float] = mapped_column(Float, nullable=False)
    lease_cycle: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="confirmed")

    land: Mapped["LandORM"] = relationship(back_populates="bookings")
    farmer: Mapped["UserORM"] = relationship(back_populates="bookings")


class BookingCreate(BaseModel):
    land_id: int
    farmer_id: int
    acres_requested: float = Field(gt=0)
    lease_cycle: str = Field(min_length=3, max_length=50)


class Booking(BookingCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str = "confirmed"
