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
    "BTC": "BTC-USD"    # Liquidity
}

class BacktestEngine:
    def __init__(self):
        self.data = {}

    def get_history(self, start_date, end_date):
        print(f"[*] Downloading historical data ({start_date} to {end_date})...")
        
        # Calculate buffer based on start date to ensure we have enough data for 200 SMA
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        buffer_start = (start_dt - pd.Timedelta(days=365)).strftime("%Y-%m-%d")

        for name, ticker in ASSETS.items():
            try:
                # Optimized download
                df = yf.download(ticker, start=buffer_start, end=end_date, progress=False, auto_adjust=True)
                
                if df.empty: continue

                # Clean up MultiIndex columns if present
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = df.columns.get_level_values(0)

                # Calculate indicators efficiently
                df['SMA_50'] = ta.sma(df['Close'], length=50)
                df['SMA_200'] = ta.sma(df['Close'], length=200)
                df['RSI'] = ta.rsi(df['Close'], length=14)
                
                # Filter strictly to requested range
                mask = (df.index >= start_date) & (df.index <= end_date)
                self.data[name] = df.loc[mask]
                
            except Exception as e:
                print(f"[!] Error processing {name}: {e}")

    def calculate_daily_risk(self, date_idx):
        daily_score = 0
        active_assets = 0
        
        for name, df in self.data.items():
            if date_idx not in df.index:
                continue
            
            active_assets += 1
            row = df.loc[date_idx]
            
            try:
                price = float(row['Close'])
                sma_50 = float(row['SMA_50']) if not pd.isna(row['SMA_50']) else 0
                sma_200 = float(row['SMA_200']) if not pd.isna(row['SMA_200']) else 0
                rsi = float(row['RSI']) if not pd.isna(row['RSI']) else 50
            except:
                continue

            if sma_200 == 0: continue

            # --- CORE LOGIC ---
            asset_risk = 0
            is_critical = False
            is_warning = False

            if price < sma_200:
                asset_risk += 10
                is_warning = True
            
            if price < sma_50 and price < sma_200:
                asset_risk += 20
                is_critical = True
                
            if rsi > 70: asset_risk += 1
            if rsi < 30: asset_risk -= 1

            if name == "JUNK":
                if is_warning or is_critical:
                    asset_risk *= 2.0
            elif name == "10Y":
                asset_risk = 0 
                if price > 4.5: asset_risk += 25
                elif price > 4.0: asset_risk += 10
            elif name == "BANKS":
                if is_critical: asset_risk += 30

            daily_score += asset_risk

        divisor = 1.5 if "BTC" in self.data and not self.data["BTC"].empty else 1.2
        final_score = min((daily_score / divisor), 100)
        
        return int(final_score)

    def run(self, scenario_key):
        # 1. Determine Dates
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
            if scenario_key not in scenarios:
                return {"error": "Invalid Scenario"}
            start, end = scenarios[scenario_key]
        
        # 2. Load Data
        self.data = {}
        self.get_history(start, end)
        
        if "SPX" not in self.data:
            return {"error": "Failed to load SPX baseline data"}

        # 3. Simulate
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
            
            # Safe getters for prices
            spx = float(self.data["SPX"].loc[date]['Close'])
            
            # Handle BTC (Might be missing on weekends or in 2008)
            btc = None
            if "BTC" in self.data and date in self.data["BTC"].index:
                btc = float(self.data["BTC"].loc[date]['Close'])
                
            # Handle 10Y
            yield10 = None
            if "10Y" in self.data and date in self.data["10Y"].index:
                yield10 = float(self.data["10Y"].loc[date]['Close'])

            results.append({
                "date": date.strftime("%Y-%m-%d"),
                "risk_score": risk_score,
                "defcon": defcon,
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
    report = engine.run("ROLLING_90D")
    if "error" in report:
        print(report["error"])
    else:
        print("Success")
