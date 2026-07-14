from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
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
    lease_duration: Mapped[str] = mapped_column(String(20), nullable=False, default="less-than-1")
    availability_period: Mapped[str] = mapped_column(String(50), nullable=False, default="Custom month")
    start_month: Mapped[str | None] = mapped_column(String(20), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    landlord: Mapped["UserORM"] = relationship(back_populates="lands")
    bookings: Mapped[list["BookingORM"]] = relationship(back_populates="land")
    crops: Mapped[list["CropORM"]] = relationship(back_populates="land")


LeaseDuration = Literal["less-than-1", "1", "2", "3", "4", "5", "more-than-5"]
StartMonth = Literal[
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]


class LandCreate(BaseModel):
    landlord_id: int
    title: str = Field(min_length=3, max_length=120)
    location: str = Field(min_length=3, max_length=120)
    total_acres: float = Field(gt=0)
    price_per_acre: float = Field(gt=0)
    lease_duration: LeaseDuration
    availability_period: str | None = Field(default=None, min_length=3, max_length=50)
    start_month: StartMonth | None = None
    description: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_lease_selection(self):
        if self.lease_duration == "less-than-1":
            if self.availability_period is None:
                raise ValueError("Availability period is required for leases shorter than one year.")
            self.start_month = None
        else:
            if self.start_month is None:
                raise ValueError("Start month is required for leases of one year or more.")
            self.availability_period = "Custom month"
        return self


class Land(LandCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_available: bool = True
