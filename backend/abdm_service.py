import os
import httpx
from dotenv import load_dotenv

# Load the secret credentials from your .env file
load_dotenv()

ABDM_CLIENT_ID = os.getenv("ABDM_CLIENT_ID")
ABDM_CLIENT_SECRET = os.getenv("ABDM_CLIENT_SECRET")

# The official ABDM Sandbox Gateway URL (v3)
GATEWAY_URL = "https://dev.abdm.gov.in/gateway/v3"

async def get_sandbox_token():
    """
    Authenticates with the ABDM Sandbox and returns a Bearer token.
    This token is required for all future requests (like sending OTPs).
    """
    url = f"{GATEWAY_URL}/sessions"
    payload = {
        "clientId": ABDM_CLIENT_ID,
        "clientSecret": ABDM_CLIENT_SECRET
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("Successfully connected to ABDM Sandbox!")
            return data.get("accessToken")
        else:
            print(f"ABDM Authentication Failed: {response.text}")
            return None