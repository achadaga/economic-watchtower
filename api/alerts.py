import requests
import json
import os
from datetime import datetime

# You will set this in Render Environment Variables later
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

def format_color(defcon):
    if defcon == 1: return 15548997 # RED
    if defcon == 2: return 15105570 # ORANGE
    if defcon == 3: return 16776960 # YELLOW
    if defcon == 4: return 3447003  # BLUE
    return 5763719                  # GREEN

def send_discord_alert(data):
    if not DISCORD_WEBHOOK_URL:
        print("[!] No Discord Webhook URL found. Skipping alert.")
        return {"status": "skipped", "reason": "No Webhook Configured"}

    risk_score = data['system_risk']
    defcon = data['defcon']
    
    # Only alert if risk is significant (Optional: remove strict check to get daily reports)
    # For now, we report everything so you know it's working.
    
    embed = {
        "title": f"🚨 WATCHTOWER REPORT: DEFCON {defcon}",
        "description": f"**System Risk Score:** {risk_score}%",
        "color": format_color(defcon),
        "fields": [],
        "footer": {
            "text": f"Scan Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC"
        }
    }

    # Add Critical Alerts
    critical_assets = [a for a in data['assets'] if a['signal'] in ['CRITICAL', 'WARNING', 'BEARISH']]
    
    if critical_assets:
        alert_text = ""
        for asset in critical_assets:
            alert_text += f"**{asset['asset']}**: {asset['signal']}\n_{asset['details']}_\n\n"
        
        embed["fields"].append({
            "name": "⚠️ Active Threats",
            "value": alert_text[:1024], # Discord limit
            "inline": False
        })
    else:
        embed["fields"].append({
            "name": "✅ Status",
            "value": "All systems nominal. No critical threats detected.",
            "inline": False
        })

    # Add 10Y Yield Context (Always important)
    ten_year = next((x for x in data['assets'] if x['asset'] == '10Y'), None)
    if ten_year:
        embed["fields"].append({
            "name": "Yield Curve (10Y)",
            "value": f"{ten_year['price']}%",
            "inline": True
        })

    payload = {
        "username": "Economic Watchtower",
        "embeds": [embed]
    }

    try:
        response = requests.post(
            DISCORD_WEBHOOK_URL, 
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return {"status": "sent"}
    except Exception as e:
        print(f"[!] Discord Send Failed: {e}")
        return {"status": "failed", "error": str(e)}
