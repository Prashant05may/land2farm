from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

from app.config import settings

Base = declarative_base()
engine = create_engine(settings.database_url, future=True)
