from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .logic import TradingAgent

app = FastAPI()

# Allow React app to talk to Python API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = TradingAgent()

@app.get("/api/status")
def get_market_status():
    """Endpoint the React app calls to get analysis"""
    results = agent.run_scan()
    return {
        "status": "online",
        "count": len(results["assets"]),
        "data": results
    }

@app.get("/")
def home():
    return {"message": "Economic Watchtower API is running"}