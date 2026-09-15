from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1/db", tags=["Cloud Database"])

# --- OUR CLOUD DATABASE (In-Memory for Prototype) ---
db_appointments = []
db_emr_records = {}

class Appointment(BaseModel):
    id: str
    patient_name: str
    patient_abha: str
    specialty: str
    symptoms: str
    status: str = "Waiting"
    time: str

class EMRUpdate(BaseModel):
    doctor_notes: str
    diagnoses: List[str]

# 1. Patient Submits Data (Stored Online)
@router.post("/appointments")
async def book_appointment(appt: Appointment):
    db_appointments.append(appt.dict())
    # Initialize a blank EMR record for this patient
    db_emr_records[appt.patient_abha] = {"notes": "", "diagnoses": [], "history": appt.symptoms}
    return {"status": "success", "message": "Stored in database"}

# 2. Doctor Receives Data (Fetched from Database)
@router.get("/appointments")
async def get_appointments():
    return db_appointments

# 3. Doctor Fetches Specific Patient EMR
@router.get("/emr/{abha_id}")
async def get_patient_emr(abha_id: str):
    return db_emr_records.get(abha_id, {"notes": "No record found.", "diagnoses": []})

# 4. Doctor Edits & Saves Patient Data
@router.put("/emr/{abha_id}")
async def update_patient_emr(abha_id: str, update: EMRUpdate):
    if abha_id in db_emr_records:
        db_emr_records[abha_id]["notes"] = update.doctor_notes
        db_emr_records[abha_id]["diagnoses"] = update.diagnoses
        return {"status": "success", "message": "EMR updated in cloud database"}
    return {"status": "error", "message": "Patient not found"}