from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, DateTime
import datetime

# We are using asynchronous SQLite to act exactly like an enterprise database
DATABASE_URL = "sqlite+aiosqlite:///./ayush_emr.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

class PatientEMR(Base):
    __tablename__ = "patient_emr"
    id = Column(Integer, primary_key=True, index=True)
    abha_id = Column(String, index=True)
    clinical_note = Column(String)
    fhir_bundle_codes = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)