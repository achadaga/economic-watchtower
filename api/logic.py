import yfinance as yf
import pandas as pd
import pandas_ta as ta
from datetime import datetime
from .config import ASSETS

class TradingAgent:
    def fetch_data(self, symbol, period="1y"):
        try:
            df = yf.download(symbol, period=period, interval="1d", progress=False, auto_adjust=True)
            return df
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            return pd.DataFrame()

    def interpret_rsi(self, rsi_val):
        if rsi_val > 70: return "Overbought", 1  # Slight risk increase
        if rsi_val < 30: return "Oversold", 0    # Potential bottom
        return "Neutral", 0

    def analyze_asset(self, symbol, name):
        df = self.fetch_data(symbol)
        if df.empty or len(df) < 200: return None

        # Technicals
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA_50'] = ta.sma(df['Close'], length=50)
        df['SMA_200'] = ta.sma(df['Close'], length=200)
        
        try:
            current_price = df['Close'].iloc[-1]
            rsi = df['RSI'].iloc[-1]
            sma_50 = df['SMA_50'].iloc[-1]
            sma_200 = df['SMA_200'].iloc[-1]
        except IndexError: return None

        # Logic & Risk Scoring
        signal = "STABLE"
        risk_contribution = 0
        trend_desc = "Sideways"
        
        # Trend Analysis
        if current_price < sma_200:
            trend_desc = "downtrend"
            signal = "WARNING"
            risk_contribution += 10 # Base risk for losing long term trend
        elif current_price < sma_50 and current_price < sma_200:
            trend_desc = "CRASH MODE"
            signal = "CRITICAL" 
            risk_contribution += 20 # High risk for breaking both SMAs

        # Momentum Risk
        momentum_desc, mom_risk = self.interpret_rsi(rsi)
        risk_contribution += mom_risk

        # Sector Specific Weighting (The "Doomsday" Logic)
        details = f"{name} is in {trend_desc}."
        
        if name == "JUNK":
            if signal in ["WARNING", "CRITICAL"]:
                risk_contribution *= 2.0 # Credit stress is double bad
                details = "CREDIT MARKETS SIGNALING RISK OFF."
        
        elif name == "10Y":
            if current_price > 4.5:
                risk_contribution += 25 # High rates are the primary crash driver
                signal = "CRITICAL"
                details = f"Yields at {current_price:.2f}% are breaking the economy."
            elif current_price > 4.0:
                risk_contribution += 10
                signal = "WARNING"
        
        elif name == "BANKS":
            if signal == "CRITICAL":
                risk_contribution += 30 # Banking crisis is immediate doomsday
                details = "SYSTEMIC FAILURE DETECTED IN BANKING SECTOR."

        elif name == "COPPER" and signal == "WARNING":
            details = "Industrial demand collapsing."

        return {
            "asset": name,
            "price": float(f"{current_price:.2f}"),
            "signal": signal,
            "trend": trend_desc,
            "risk_score": min(risk_contribution, 100), # Cap individual contribution
            "details": details,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }

    def run_scan(self):
        results = []
        total_risk = 0
        report_count = 0

        for name, symbol in ASSETS.items():
            analysis = self.analyze_asset(symbol, name)
            if analysis: 
                results.append(analysis)
                total_risk += analysis['risk_score']
                report_count += 1
        
        # Calculate Global System Risk (Normalized 0-100)
        # We assume a "Max Risk" scenario is around 150 raw points
        global_risk = min((total_risk / 1.5), 100) if report_count > 0 else 0
        
        # Determine Defcon Level
        defcon = 5
        if global_risk > 80: defcon = 1
        elif global_risk > 60: defcon = 2
        elif global_risk > 40: defcon = 3
        elif global_risk > 20: defcon = 4

        return {
            "system_risk": int(global_risk),
            "defcon": defcon,
            "assets": results
        }