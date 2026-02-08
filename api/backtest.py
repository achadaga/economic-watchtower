import yfinance as yf
import pandas as pd
import pandas_ta as ta
from datetime import datetime

ASSETS = {
    "SPX": "^GSPC",     # Stocks
    "10Y": "^TNX",      # Yields
    "JUNK": "HYG",      # Credit
    "BANKS": "KBE",     # Systemic Health
    "BTC": "BTC-USD"    # Liquidity
}

class BacktestEngine:
    def __init__(self):
        self.data = {}

    def get_history(self, start_date, end_date):
        print(f"[*] Downloading historical data ({start_date} to {end_date})...")
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        buffer_start = (start_dt - pd.Timedelta(days=365)).strftime("%Y-%m-%d")

        for name, ticker in ASSETS.items():
            try:
                df = yf.download(ticker, start=buffer_start, end=end_date, progress=False, auto_adjust=True)
                if df.empty: continue
                
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = df.columns.get_level_values(0)

                df['SMA_50'] = ta.sma(df['Close'], length=50)
                df['SMA_200'] = ta.sma(df['Close'], length=200)
                df['RSI'] = ta.rsi(df['Close'], length=14)
                
                mask = (df.index >= start_date) & (df.index <= end_date)
                self.data[name] = df.loc[mask]
                
            except Exception as e:
                print(f"[!] Error processing {name}: {e}")

    def calculate_daily_risk(self, date_idx):
        daily_score = 0
        reasons = [] # NEW: Store explanations
        
        for name, df in self.data.items():
            if date_idx not in df.index: continue
            
            row = df.loc[date_idx]
            try:
                price = float(row['Close'])
                sma_50 = float(row['SMA_50']) if not pd.isna(row['SMA_50']) else 0
                sma_200 = float(row['SMA_200']) if not pd.isna(row['SMA_200']) else 0
                rsi = float(row['RSI']) if not pd.isna(row['RSI']) else 50
            except: continue

            if sma_200 == 0: continue

            # --- LOGIC WITH EXPLANATIONS ---
            asset_risk = 0
            is_warning = False
            is_critical = False

            # Trend
            if price < sma_200:
                asset_risk += 10
                is_warning = True
                reasons.append(f"[{name}] Lost 200-Day Trend (+10)")
            
            # Crash Mode
            if price < sma_50 and price < sma_200:
                asset_risk += 20
                is_critical = True
                reasons.append(f"[{name}] CRITICAL: Below 50 & 200 SMA (+20)")
                
            # Momentum
            if rsi > 70: 
                asset_risk += 1
            if rsi < 30: 
                asset_risk -= 1
                reasons.append(f"[{name}] Oversold (RSI < 30) (-1)")

            # Multipliers
            if name == "JUNK":
                if is_warning or is_critical:
                    asset_risk *= 2.0
                    reasons.append(f"[{name}] CREDIT STRESS MULTIPLIER (x2.0)")
            
            elif name == "10Y":
                asset_risk = 0 
                if price > 4.5: 
                    asset_risk += 25
                    reasons.append(f"[{name}] YIELDS > 4.5% (+25)")
                elif price > 4.0: 
                    asset_risk += 10
                    reasons.append(f"[{name}] YIELDS > 4.0% (+10)")
            
            elif name == "BANKS":
                if is_critical: 
                    asset_risk += 30
                    reasons.append(f"[{name}] BANKING SYSTEM FAILURE (+30)")

            daily_score += asset_risk

        divisor = 1.5 if "BTC" in self.data and not self.data["BTC"].empty else 1.2
        final_score = min((daily_score / divisor), 100)
        
        return int(final_score), reasons

    def run(self, scenario_key):
        if scenario_key == "ROLLING_90D":
            end_dt = datetime.now()
            start_dt = end_dt - pd.Timedelta(days=90)
            end = end_dt.strftime("%Y-%m-%d")
            start = start_dt.strftime("%Y-%m-%d")
        elif scenario_key == "ROLLING_180D":
            end_dt = datetime.now()
            start_dt = end_dt - pd.Timedelta(days=180)
            end = end_dt.strftime("%Y-%m-%d")
            start = start_dt.strftime("%Y-%m-%d")
        else:
            scenarios = {
                "2020_COVID": ("2019-12-01", "2020-06-01"),
                "2008_GFC": ("2007-06-01", "2009-01-01"),
                "2022_INFLATION": ("2021-11-01", "2022-12-31")
            }
            if scenario_key not in scenarios: return {"error": "Invalid Scenario"}
            start, end = scenarios[scenario_key]
        
        self.data = {}
        self.get_history(start, end)
        
        if "SPX" not in self.data: return {"error": "Failed to load SPX data"}

        results = []
        timeline = self.data["SPX"].index
        
        for date in timeline:
            risk_score, reasons = self.calculate_daily_risk(date)
            
            defcon = 5
            if risk_score > 80: defcon = 1
            elif risk_score > 60: defcon = 2
            elif risk_score > 40: defcon = 3
            elif risk_score > 20: defcon = 4
            
            spx = float(self.data["SPX"].loc[date]['Close'])
            btc = float(self.data["BTC"].loc[date]['Close']) if "BTC" in self.data and date in self.data["BTC"].index else None
            yield10 = float(self.data["10Y"].loc[date]['Close']) if "10Y" in self.data and date in self.data["10Y"].index else None

            results.append({
                "date": date.strftime("%Y-%m-%d"),
                "risk_score": risk_score,
                "defcon": defcon,
                "reasons": reasons, # NEW FIELD
                "spx_price": spx,
                "btc_price": btc,
                "yield_10y": yield10
            })
            
        return {
            "scenario": scenario_key,
            "period": f"{start} to {end}",
            "timeline": results
        }

if __name__ == "__main__":
    engine = BacktestEngine()
    print("Running test...")
    report = engine.run("ROLLING_90D")
    if "error" in report: print(report["error"])
    else: print("Success")
