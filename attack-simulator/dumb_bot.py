
import requests
import json
import time

URL = "http://localhost:8000/api/v1/telemetry"

def run_dumb_bot():
    print("🤖 Starting DUMB BOT attack...")
    
    # 1. Simulate a basic request (like a simple scraper)
    # Missing User-Agent, headless-like behavior, no mouse
    payload = {
        "user_agent": "python-requests/2.28.0", # Obvious bot UA
        "screen_resolution": "800x600",
        "timezone": "UTC",
        "language": "en-US",
        "platform": "Linux",
        "hardware_concurrency": 1,
        "webdriver": True, # Honest bot
        "headers": {},
        # No behavior data
        "honeypot_triggered": True # Being dumb and filling everything
    }
    
    try:
        start = time.time()
        res = requests.post(URL, json=payload)
        latency = (time.time() - start) * 1000
        
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Attack sent in {latency:.2f}ms")
            print(f"📊 Verdict: {data['verdict'].upper()} (Confidence: {data['confidence']})")
            print(f"🚩 Flags: {data['flags']}")
            
            if data['verdict'] == 'bot':
                print("\nSUCCESS: The bot was caught!")
            else:
                print("\nFAIL: The bot bypassed detection.")
        else:
            print(f"❌ Error: Server returned {res.status_code}")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    run_dumb_bot()
