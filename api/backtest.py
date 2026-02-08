import yfinance as yf
import pandas as pd
import pandas_ta as ta
from datetime import datetime

# Define assets locally to ensure standalone execution works
ASSETS = {
    "SPX": "^GSPC",     # Stocks
    "10Y": "^TNX",      # Yields
    "JUNK": "HYG",      # Credit
    "BANKS": "KBE",     # Systemic Health
    "BTC": "BTC-USD"    # Liquidity (Won't have data for 2008, handled gracefully)
}

class BacktestEngine:
    def __init__(self):
        self.data = {}

    def get_history(self, start_date, end_date):
        """Fetches historical data with a buffer for moving averages"""
        print(f"[*] Downloading historical data ({start_date} to {end_date})...")
        
        # We need data from BEFORE the start date to calculate the 200-day SMA correctly
        # otherwise the first 200 days of the simulation would be blank.
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        buffer_start = (start_dt - pd.Timedelta(days=365)).strftime("%Y-%m-%d")

        for name, ticker in ASSETS.items():
            try:
                df = yf.download(ticker, start=buffer_start, end=end_date, progress=False, auto_adjust=True)
                
                if df.empty:
                    print(f"[!] Warning: No data for {name} (might not have existed then)")
                    continue

                # Clean up MultiIndex columns if present (yfinance update quirk)
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = df.columns.get_level_values(0)

                # Calculate Indicators
                df['SMA_50'] = ta.sma(df['Close'], length=50)
                df['SMA_200'] = ta.sma(df['Close'], length=200)
                df['RSI'] = ta.rsi(df['Close'], length=14)
                
                # Trim data to the actual requested period
                mask = (df.index >= start_date) & (df.index <= end_date)
                self.data[name] = df.loc[mask]
                
            except Exception as e:
                print(f"[!] Error processing {name}: {e}")

    def calculate_daily_risk(self, date_idx):
        """
        Replicates the exact logic from logic.py, but applied to a specific historical date.
        """
        daily_score = 0
        active_assets = 0
        
        for name, df in self.data.items():
            if date_idx not in df.index:
                continue
            
            active_assets += 1
            row = df.loc[date_idx]
            
            # Extract scalar values safely
            price = float(row['Close'])
            sma_50 = float(row['SMA_50']) if not pd.isna(row['SMA_50']) else 0
            sma_200 = float(row['SMA_200']) if not pd.isna(row['SMA_200']) else 0
            rsi = float(row['RSI']) if not pd.isna(row['RSI']) else 50

            # Skip if not enough history for 200 SMA yet
            if sma_200 == 0: continue

            # --- CORE LOGIC (Same as logic.py) ---
            asset_risk = 0
            is_critical = False
            is_warning = False

            # Trend
            if price < sma_200:
                asset_risk += 10
                is_warning = True
            
            # Crash Mode
            if price < sma_50 and price < sma_200:
                asset_risk += 20
                is_critical = True
                
            # Momentum
            if rsi > 70: asset_risk += 1
            if rsi < 30: asset_risk -= 1

            # Multipliers
            if name == "JUNK":
                if is_warning or is_critical:
                    asset_risk *= 2.0
            
            elif name == "10Y":
                asset_risk = 0 # Reset trend risk, look at absolute yield
                if price > 4.5: asset_risk += 25
                elif price > 4.0: asset_risk += 10
            
            elif name == "BANKS":
                if is_critical: asset_risk += 30

            daily_score += asset_risk

        # Normalize Score
        # We adjust divisor based on active assets to handle 2008 (when BTC didn't exist)
        divisor = 1.5 if "BTC" in self.data and not self.data["BTC"].empty else 1.2
        final_score = min((daily_score / divisor), 100)
        
        return int(final_score)

    def run(self, scenario_key):
        scenarios = {
            "2020_COVID": ("2019-12-01", "2020-06-01"),
            "2008_GFC": ("2007-06-01", "2009-01-01"),
            "2022_INFLATION": ("2021-11-01", "2022-12-31")
        }
        
        if scenario_key not in scenarios:
            return {"error": "Invalid Scenario. Options: 2020_COVID, 2008_GFC, 2022_INFLATION"}

        start, end = scenarios[scenario_key]
        
        # Clear previous data
        self.data = {}
        self.get_history(start, end)
        
        if "SPX" not in self.data:
            return {"error": "Failed to load SPX baseline data"}

        results = []
        timeline = self.data["SPX"].index
        
        print(f"[*] Simulating {len(timeline)} trading days...")

        for date in timeline:
            risk_score = self.calculate_daily_risk(date)
            
            defcon = 5
            if risk_score > 80: defcon = 1
            elif risk_score > 60: defcon = 2
            elif risk_score > 40: defcon = 3
            elif risk_score > 20: defcon = 4
            
            results.append({
                "date": date.strftime("%Y-%m-%d"),
                "risk_score": risk_score,
                "defcon": defcon,
                "spx_price": float(self.data["SPX"].loc[date]['Close'])
            })
            
        return {
            "scenario": scenario_key,
            "period": f"{start} to {end}",
            "timeline": results
        }

if __name__ == "__main__":
    # Local Test
    engine = BacktestEngine()
    report = engine.run("2020_COVID")
    
    if "error" in report:
        print(report["error"])
    else:
        # Find peak risk
        peak = max(report["timeline"], key=lambda x: x['risk_score'])
        print(f"\n--- REPORT: {report['scenario']} ---")
        print(f"Peak Risk: {peak['risk_score']}% (DEFCON {peak['defcon']})")
        print(f"Date of Peak: {peak['date']}")
        print(f"S&P 500 at Peak Risk: ${peak['spx_price']}")
