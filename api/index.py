from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .logic import TradingAgent
import traceback

app = FastAPI()

# NUCLEAR CORS OPTION: Allow absolutely everything to prevent blocking
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# Initialize agent safely
try:
    agent = TradingAgent()
except Exception as e:
    print(f"FAILED TO INIT AGENT: {e}")
    agent = None

@app.get("/api/status")
def get_market_status():
    if not agent:
        return {"status": "error", "message": "Agent failed to initialize. Check logs."}

    try:
        # Run the scan
        results = agent.run_scan()
        
        # Check if we actually got assets back
        if not results or "assets" not in results:
            return {
                "status": "warning", 
                "message": "Scan ran but returned no data.",
                "data": results
            }

        return {
            "status": "online",
            "count": len(results["assets"]),
            "data": results
        }
    except Exception as e:
        # Capture the full traceback to see exactly where it crashed
        error_details = traceback.format_exc()
        print(f"CRASH REPORT: {error_details}")
        return {
            "status": "critical_error", 
            "message": str(e),
            "traceback": error_details
        }

@app.get("/")
def home():
    return {"message": "Economic Watchtower API is running"}
