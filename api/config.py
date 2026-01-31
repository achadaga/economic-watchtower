# --- CONFIGURATION MODULE ---
# This file serves as the central control for what the agent watches.

ASSETS = {
    # --- MACRO & RISK ---
    "SPX": "^GSPC",     # S&P 500 (General Market)
    "10Y": "^TNX",      # 10-Year Treasury Yield (Interest Rates)
    "JUNK": "HYG",      # High Yield Corp Bonds (Subprime/Credit Risk)
    
    # --- BUBBLE & SECTOR WATCH ---
    "AI_CHIP": "NVDA",  # AI Proxy (Nvidia)
    "DATA_CTR": "EQIX", # Data Center Real Estate (Equinix)
    "REAL_EST": "VNQ",  # General Real Estate ETF
    "BANKS": "KBE",     # Bank ETF (Systemic Stability Check)
    
    # --- ECONOMIC HEALTH INDICATORS ---
    "LABOR": "XLY",       # Consumer Discretionary (Labor market proxy)
    "SMALL_CAP": "IWM",   # Russell 2000 (Domestic Economy Health)
    "TRANSPORTS": "IYT",  # Transportation (Supply Chain/Real Economy)
    "COPPER": "CPER"      # Dr. Copper (Industrial Demand)
}