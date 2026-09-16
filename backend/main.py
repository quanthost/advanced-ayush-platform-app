from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title="AYUSH Fast Prototype Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IN-MEMORY DATABASE FOR PROTOTYPING ---
db_appointments = []
db_emr_records = {}

class Appointment(BaseModel):
    id: str
    patient_name: str
    patient_abha: str
    doctor_name: str
    specialty: str
    symptoms: str
    status: str
    time: str

class EMRUpdate(BaseModel):
    doctor_notes: str
    diagnoses: List[dict] = []

@app.post("/api/v1/db/appointments")
async def book_appointment(appt: Appointment):
    db_appointments.append(appt.dict())
    db_emr_records[appt.patient_abha] = {"notes": "", "diagnoses": []}
    return {"status": "success"}

@app.get("/api/v1/db/appointments")
async def get_appointments():
    return db_appointments

@app.get("/api/v1/db/emr/{abha_id}")
async def get_patient_emr(abha_id: str):
    return db_emr_records.get(abha_id, {"notes": "", "diagnoses": []})

@app.put("/api/v1/db/emr/{abha_id}")
async def update_patient_emr(abha_id: str, update: EMRUpdate):
    if abha_id in db_emr_records:
        db_emr_records[abha_id]["notes"] = update.doctor_notes
        db_emr_records[abha_id]["diagnoses"] = update.diagnoses
    return {"status": "success"}

# Terminology Lookup
TERMINOLOGY_DB = [
    {"code": "NAM:AYU-AM01", "label": "Amavata (Rheumatoid Spectrum)", "system": "Ayurveda"},
    {"code": "NAM:AYU-PR03", "label": "Prameha (Metabolic / Diabetic Spectrum)", "system": "Ayurveda"}
]

@app.get("/api/v1/terminology/search")
async def search_medical_terms(q: str = "") -> List[Dict[str, str]]:
    query = q.strip().lower()
    return [t for t in TERMINOLOGY_DB if query in t["label"].lower() or query in t["code"].lower()]