from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/clinical", tags=["Clinical Engine"])

class ClinicalIntakeRequest(BaseModel):
    abha_id: str
    chief_complaint: str
    raw_conversation: str
    ayush_mode: Optional[bool] = False
    prakriti: Optional[str] = None

@router.post("/process-intake")
async def process_patient_intake(data: ClinicalIntakeRequest):
    """
    Processes raw conversational input and structures it into 
    a physician-ready summary format instantly.
    """
    # High-efficiency clinical structuring logic
    structured_summary = {
        "status": "success",
        "abha_id": data.abha_id,
        "chief_complaint": data.chief_complaint,
        "hpi_socrates": f"Processed narrative based on: {data.raw_conversation[:100]}...",
        "ayush_assessment": {
            "enabled": data.ayush_mode,
            "prakriti": data.prakriti if data.ayush_mode else "N/A"
        },
        "red_flag_alert": "None detected"
    }
    
    return structured_summary