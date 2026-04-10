from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class CropORM(Base):
    __tablename__ = "crops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    season: Mapped[str] = mapped_column(String(40), nullable=False)
    expected_yield_tons: Mapped[float] = mapped_column(Float, nullable=False)
    land_id: Mapped[int | None] = mapped_column(ForeignKey("lands.id"), nullable=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    farmer: Mapped["UserORM"] = relationship(back_populates="crops")
    land: Mapped["LandORM"] = relationship(back_populates="crops")
    orders: Mapped[list["OrderORM"]] = relationship(back_populates="crop")


class CropCreate(BaseModel):
    farmer_id: int
    name: str = Field(min_length=2, max_length=80)
    season: str = Field(min_length=2, max_length=40)
    expected_yield_tons: float = Field(gt=0)
    land_id: int | None = None
    notes: str | None = Field(default=None, max_length=500)


class Crop(CropCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
