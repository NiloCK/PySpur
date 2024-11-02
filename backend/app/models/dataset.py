from sqlalchemy import Column, Computed, Integer, String, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True)
    prefid = Column(String, Computed("'DS' || id"), nullable=False, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.now(timezone.utc))
