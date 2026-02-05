from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .logic import TradingAgent
import traceback
import datetime

app = FastAPI()

# Allow React app to talk to Python API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# --- Data Models ---
class Lead(BaseModel):
    name: str
    email: str

# --- Routes ---

# Initialize agent
try:
    agent = TradingAgent()
except Exception as e:
    print(f"FAILED TO INIT AGENT: {e}")
    agent = None

@app.get("/api/status")
def get_market_status():
    if not agent:
        return {"status": "error", "message": "Agent failed to initialize."}
    try:
        results = agent.run_scan()
        return {"status": "online", "count": len(results["assets"]), "data": results}
    except Exception as e:
        return {"status": "critical_error", "message": str(e), "traceback": traceback.format_exc()}

@app.post("/api/capture-lead")
def capture_lead(lead: Lead):
    """
    Receives user data before allowing download.
    In a real app, save this to a database (Postgres/Firebase).
    For now, we log it to the system console for retrieval.
    """
    timestamp = datetime.datetime.now().isoformat()
    
    # LOGGING THE LEAD (Check Render Dashboard > Logs to see these)
    print(f"[{timestamp}] NEW LEAD CAPTURED: {lead.name} | {lead.email}")
    
    return {"status": "success", "message": "Lead captured"}

@app.get("/")
def home():
    return {"message": "Economic Watchtower API is running"}
