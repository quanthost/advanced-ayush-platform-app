from fastapi import APIRouter
from typing import List, Dict

router = APIRouter(prefix="/api/v1/terminology", tags=["Medical Codings"])

TERMINOLOGY_DB = [
    # Allopathy (ICD-11)
    {"code": "ICD11:BA00", "label": "Essential Hypertension", "system": "Allopathy"},
    {"code": "ICD11:5A11", "label": "Type 2 Diabetes Mellitus", "system": "Allopathy"},
    {"code": "ICD11:FA20", "label": "Rheumatoid Arthritis", "system": "Allopathy"},
    # AYUSH (NAMASTE / Morbidity Codes)
    {"code": "NAM:AYU-AM01", "label": "Amavata (Rheumatoid Spectrum)", "system": "Ayurveda"},
    {"code": "NAM:AYU-PR03", "label": "Prameha (Metabolic / Diabetic Spectrum)", "system": "Ayurveda"},
    {"code": "NAM:AYU-KT05", "label": "Katishoola (Lumbago / Back Pain)", "system": "Ayurveda"},
    {"code": "NAM:AYU-AG02", "label": "Agnimandya (Digestive Impairment)", "system": "Ayurveda"}
]

@router.get("/search")
async def search_medical_terms(q: str = "") -> List[Dict[str, str]]:
    query = q.strip().lower()
    if not query:
        return []
    return [
        term for term in TERMINOLOGY_DB
        if query in term["label"].lower() or query in term["code"].lower()
    ]