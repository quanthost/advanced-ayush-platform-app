import os
import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from twilio.rest import Client

router = APIRouter(prefix="/api/v1/auth", tags=["ABDM Authentication"])

class OTPRequest(BaseModel):
    identifier: str  # Must include country code, e.g., "+919876543210"

# In-memory dictionary to store OTPs temporarily for verification later
# (In a massive production app, this would be stored in Redis)
otp_vault = {}

@router.post("/request-otp")
async def request_real_otp(data: OTPRequest):
    # 1. Generate a secure 4-digit OTP
    real_otp = str(random.randint(1000, 9999))
    
    # 2. Store it locally so we can check it when the user types it in
    otp_vault[data.identifier] = real_otp

    # 3. Pull secure credentials from Render's environment variables
    TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER")

    try:
        # 4. Fire the physical SMS via telecom networks
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        message = client.messages.create(
            body=f"Your Binary Brains Ayush verification code is {real_otp}. Do not share this with anyone.",
            from_=TWILIO_PHONE,
            to=data.identifier
        )
        
        return {
            "status": "success",
            "message": "Real OTP successfully dispatched.",
            "sid": message.sid
        }
    except Exception as e:
        print(f"Twilio Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to ping telecom network")