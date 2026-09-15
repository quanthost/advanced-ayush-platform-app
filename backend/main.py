import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# -------------------------------------------------------------
# DATABASE CONFIGURATION & ENTERPRISE PERSISTENCE
# -------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ayush_enterprise.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -------------------------------------------------------------
# RELATIONAL DATABASE MODELS
# -------------------------------------------------------------
class AppointmentModel(Base):
    __tablename__ = "appointments"
    id = Column(String, primary_key=True, index=True)
    patient_abha = Column(String, index=True)
    patient_name = Column(String)
    doctor_name = Column(String)
    system = Column(String)        # Ayurveda, Allopathy, Siddha, Unani, etc.
    specialty = Column(String)     # Kayachikitsa, Shalya, Panchakarma, etc.
    symptoms = Column(Text)
    category = Column(String)      # OPD, Video Consult, Therapy, Lab Checkup
    status = Column(String, default="Waiting") # Waiting, In-Consult, Completed, Cancelled
    scheduled_time = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ClinicalRecordModel(Base):
    __tablename__ = "clinical_records"
    id = Column(String, primary_key=True, index=True)
    patient_abha = Column(String, index=True)
    doctor_name = Column(String)
    record_type = Column(String)   # EMR, Prescription, Prakriti, Nadi, Therapy, Lab
    title = Column(String)
    clinical_notes = Column(Text)
    namaste_codes = Column(JSON, default=list)
    icd11_codes = Column(JSON, default=list)
    vitals_prakriti = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

class DepositLedgerModel(Base):
    __tablename__ = "deposit_ledgers"
    id = Column(String, primary_key=True, index=True)
    patient_abha = Column(String, index=True)
    amount = Column(Integer)
    payment_mode = Column(String)
    reference_id = Column(String)
    status = Column(String, default="Credited")
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------------------
# FASTAPI APP & INTERFACES
# -------------------------------------------------------------
app = FastAPI(title="AYUSH Enterprise Clinical Core", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Schemas
class AppointmentCreate(BaseModel):
    id: str
    patient_abha: str
    patient_name: str
    doctor_name: str = "Dr. Sujai S"
    system: str = "Ayurveda"
    specialty: str = "Kayachikitsa"
    symptoms: str
    category: str = "OPD"
    scheduled_time: str

class ClinicalRecordCreate(BaseModel):
    id: str
    patient_abha: str
    doctor_name: str
    record_type: str
    title: str
    clinical_notes: str
    namaste_codes: List[dict] = []
    icd11_codes: List[dict] = []
    vitals_prakriti: dict = {}

class DepositCreate(BaseModel):
    id: str
    patient_abha: str
    amount: int
    payment_mode: str
    reference_id: str

# -------------------------------------------------------------
# CLINICAL INTELLIGENCE & TERMINOLOGY DICTIONARIES
# -------------------------------------------------------------
TERMINOLOGY_DB = [
    {"code": "NAM:AYU-AM01", "label": "Amavata (Rheumatoid Spectrum)", "system": "Ayurveda"},
    {"code": "NAM:AYU-PR03", "label": "Prameha (Metabolic / Diabetic Spectrum)", "system": "Ayurveda"},
    {"code": "NAM:AYU-KT05", "label": "Katishoola (Lumbago / Sciatica)", "system": "Ayurveda"},
    {"code": "NAM:AYU-AG02", "label": "Agnimandya (Digestive Impairment)", "system": "Ayurveda"},
    {"code": "NAM:AYU-SN04", "label": "Sandhigata Vata (Osteoarthritis)", "system": "Ayurveda"},
    {"code": "ICD11:FA20", "label": "Rheumatoid Arthritis", "system": "Allopathy"},
    {"code": "ICD11:5A11", "label": "Type 2 Diabetes Mellitus", "system": "Allopathy"},
    {"code": "ICD11:BA00", "label": "Essential Hypertension", "system": "Allopathy"}
]

# -------------------------------------------------------------
# RESTFUL API ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/v1/clinical/triage-and-route")
async def ai_triage(data: dict):
    narrative = data.get("narrative", "").lower()
    pref_sys = data.get("preferred_system", "Ayurveda")
    
    # Red Flag Emergency Protocol
    if any(k in narrative for k in ["chest pain", "shortness of breath", "stroke", "unconscious"]):
        return {
            "triage_level": "RED_FLAG_EMERGENCY",
            "system_recommended": "Allopathy",
            "specialty": "Emergency Medicine / Critical Care",
            "reasoning": "High-risk acute clinical red flags detected. Routine queue bypassed.",
            "suggested_doctors": [{"id": "D-01", "name": "Dr. Sujai S", "specialty": "Emergency Care"}]
        }
    
    spec = "General Medicine"
    if any(k in narrative for k in ["joint", "knee", "swelling", "stiffness", "arthritis"]):
        spec = "Kayachikitsa (Joints & Metabolism)" if pref_sys == "Ayurveda" else "Orthopedics"
    elif any(k in narrative for k in ["skin", "rash", "itching", "eczema"]):
        spec = "Twak Roga" if pref_sys == "Ayurveda" else "Dermatology"
    elif any(k in narrative for k in ["digestion", "gas", "acidity", "stomach"]):
        spec = "Agni & Koshta Rogas" if pref_sys == "Ayurveda" else "Gastroenterology"

    return {
        "triage_level": "ROUTINE",
        "system_recommended": pref_sys,
        "specialty": spec,
        "reasoning": f"Symptom profile mapped directly to standard {pref_sys} {spec} intake protocol.",
        "suggested_doctors": [
            {"id": "D-01", "name": "Dr. Sujai S", "specialty": spec},
            {"id": "D-02", "name": "Dr. Ananya P", "specialty": spec}
        ]
    }

@app.get("/api/v1/terminology/search")
async def search_terminology(q: str = ""):
    query = q.strip().lower()
    if not query:
        return []
    return [item for item in TERMINOLOGY_DB if query in item["label"].lower() or query in item["code"].lower()]

@app.post("/api/v1/appointments")
async def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    record = AppointmentModel(**payload.dict())
    db.add(record)
    db.commit()
    return {"status": "success", "message": "Appointment persisted to database", "id": payload.id}

@app.get("/api/v1/appointments")
async def list_appointments(patient_abha: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AppointmentModel)
    if patient_abha:
        query = query.filter(AppointmentModel.patient_abha == patient_abha)
    return query.order_by(AppointmentModel.created_at.desc()).all()

@app.put("/api/v1/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, payload: dict, db: Session = Depends(get_db)):
    appt = db.query(AppointmentModel).filter(AppointmentModel.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = payload.get("status", appt.status)
    db.commit()
    return {"status": "success", "message": "Status updated"}

@app.post("/api/v1/clinical/records")
async def create_clinical_record(payload: ClinicalRecordCreate, db: Session = Depends(get_db)):
    record = ClinicalRecordModel(**payload.dict())
    db.add(record)
    db.commit()
    return {"status": "success", "message": "Clinical record persisted to national registry"}

@app.get("/api/v1/clinical/records/{patient_abha}")
async def get_patient_records(patient_abha: str, db: Session = Depends(get_db)):
    return db.query(ClinicalRecordModel).filter(ClinicalRecordModel.patient_abha == patient_abha).order_by(ClinicalRecordModel.created_at.desc()).all()

@app.post("/api/v1/billing/deposits")
async def record_deposit(payload: DepositCreate, db: Session = Depends(get_db)):
    deposit = DepositLedgerModel(**payload.dict())
    db.add(deposit)
    db.commit()
    return {"status": "success", "message": "Deposit processed and logged"}

@app.get("/api/v1/billing/deposits/{patient_abha}")
async def list_deposits(patient_abha: str, db: Session = Depends(get_db)):
    return db.query(DepositLedgerModel).filter(DepositLedgerModel.patient_abha == patient_abha).all()