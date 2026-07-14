import os

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "land2farm"
    app_version: str = "0.1.0"
    min_lease_months: int = 6
    allowed_lease_cycles: tuple[str, ...] = ("Jan-Jun", "Jul-Dec")
    allowed_start_months: tuple[str, ...] = (
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
    )
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://root:root123@postgres:5432/land2farm",
    )


settings = Settings()
