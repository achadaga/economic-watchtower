from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .logic import TradingAgent
from .backtest import BacktestEngine  # Import the new engine
import traceback
import datetime

app = FastAPI()

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

class BacktestRequest(BaseModel):
    scenario: str # "2020_COVID", "2008_GFC", etc.

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
    timestamp = datetime.datetime.now().isoformat()
    print(f"[{timestamp}] NEW LEAD CAPTURED: {lead.name} | {lead.email}")
    return {"status": "success", "message": "Lead captured"}

@app.post("/api/backtest")
def run_backtest(req: BacktestRequest):
    """
    Runs the logic engine against historical data.
    """
    try:
        engine = BacktestEngine()
        results = engine.run(req.scenario)
        return {"status": "success", "data": results}
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

@app.get("/")
def home():
    return {"message": "Economic Watchtower API is running"}
