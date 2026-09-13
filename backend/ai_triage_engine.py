from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/v1/clinical", tags=["AI Clinical Engine"])

class SymptomIntakeRequest(BaseModel):
    narrative: str
    preferred_system: str = "Any"  # "Ayurveda", "Allopathy", or "Any"

@router.post("/triage-and-route")
async def triage_and_route(data: SymptomIntakeRequest):
    text = data.narrative.lower()
    
    # 1. Red Flag Detection (Emergency bypass)
    emergency_keywords = ["chest pain", "shortness of breath", "loss of consciousness", "stroke"]
    if any(k in text for k in emergency_keywords):
        return {
            "triage_level": "EMERGENCY_RED_FLAG",
            "system_recommended": "Allopathy",
            "specialty": "Emergency Medicine / Cardiology",
            "reasoning": "High-risk acute presentation detected. Immediate physical triage required.",
            "suggested_doctors": [{"id": "D-01", "name": "Dr. Sujai S", "specialty": "Emergency Care"}]
        }

    # 2. Chronic & Holistic vs Acute Analysis
    ayurveda_friendly = ["joint pain", "digestion", "gas", "skin", "stress", "insomnia", "rejuvenation"]
    is_ayurvedic_fit = any(k in text for k in ayurveda_friendly)
    
    selected_system = data.preferred_system
    if selected_system == "Any":
        selected_system = "Ayurveda" if is_ayurvedic_fit else "Allopathy"

    # 3. Specialty Mapping
    specialty = "General Medicine"
    if "joint" in text or "arthritis" in text:
        specialty = "Kayachikitsa (Ayurveda Rheumatology)" if selected_system == "Ayurveda" else "Orthopedics"
    elif "skin" in text:
        specialty = "Twak Roga" if selected_system == "Ayurveda" else "Dermatology"
    elif "digestion" in text or "stomach" in text:
        specialty = "Agni & Annavaha Srotas" if selected_system == "Ayurveda" else "Gastroenterology"

    return {
        "triage_level": "ROUTINE",
        "system_recommended": selected_system,
        "specialty": specialty,
        "reasoning": f"Identified complaint pattern aligning with {selected_system} {specialty} protocol.",
        "suggested_doctors": [
            {"id": "D-01", "name": "Dr. Sujai S", "specialty": specialty, "wait_time": "10 mins"},
            {"id": "D-02", "name": "Dr. Ananya P", "specialty": specialty, "wait_time": "25 mins"}
        ]
    }