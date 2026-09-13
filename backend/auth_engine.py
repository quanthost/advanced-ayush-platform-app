from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/auth", tags=["ABDM Authentication"])

class OTPRequest(BaseModel):
    identifier: str  

@router.post("/request-otp")
async def request_sandbox_otp(data: OTPRequest):
    """
    Prepares the gateway for the official ABDM Sandbox integration.
    """
    try:
        return {
            "status": "success",
            "message": f"Ready for ABDM Gateway connection for {data.identifier}",
            "transaction_id": "TXN-ABDM-PENDING-KEYS"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Sandbox connection failed")