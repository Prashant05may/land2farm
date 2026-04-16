from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import text

from app.config import settings
from app.db.database import Base, engine
from app.models.booking import BookingORM
from app.models.crop import CropORM
from app.models.land import LandORM
from app.models.order import OrderORM
from app.models.session import AuthSessionORM
from app.models.user import UserORM
from app.routes.auth import router as auth_router
from app.routes.farmer import router as farmer_router
from app.routes.industry import router as industry_router
from app.routes.land import router as land_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Smart agriculture marketplace MVP for farmers, landlords, and industries.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(land_router)
app.include_router(farmer_router)
app.include_router(industry_router)


@app.on_event("startup")
def startup():
    # Importing the ORM models above ensures metadata is populated before table creation.
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT ''"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE lands ADD COLUMN IF NOT EXISTS lease_duration VARCHAR(20) NOT NULL DEFAULT 'less-than-1'"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE lands ADD COLUMN IF NOT EXISTS start_month VARCHAR(20)"
            )
        )


@app.get("/")
def root():
    return RedirectResponse(url="http://localhost:8080", status_code=307)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "database": "configured",
    }
