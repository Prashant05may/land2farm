from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class LandORM(Base):
    __tablename__ = "lands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    total_acres: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_acre: Mapped[float] = mapped_column(Float, nullable=False)
    availability_period: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    landlord: Mapped["UserORM"] = relationship(back_populates="lands")
    bookings: Mapped[list["BookingORM"]] = relationship(back_populates="land")
    crops: Mapped[list["CropORM"]] = relationship(back_populates="land")


class LandCreate(BaseModel):
    landlord_id: int
    title: str = Field(min_length=3, max_length=120)
    location: str = Field(min_length=3, max_length=120)
    total_acres: float = Field(gt=0)
    price_per_acre: float = Field(gt=0)
    availability_period: str = Field(min_length=3, max_length=50)
    description: str | None = Field(default=None, max_length=500)


class Land(LandCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_available: bool = True
