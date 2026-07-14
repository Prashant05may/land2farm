from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class OrderORM(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    industry_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    crop_id: Mapped[int] = mapped_column(ForeignKey("crops.id"), nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending")

    industry: Mapped["UserORM"] = relationship(back_populates="orders")
    crop: Mapped["CropORM"] = relationship(back_populates="orders")


class OrderCreate(BaseModel):
    industry_id: int
    crop_id: int
    quantity: float = Field(gt=0)
    price: float = Field(gt=0)


class Order(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    industry_id: int
    crop_id: int
    quantity: float
    price: float
    status: str
