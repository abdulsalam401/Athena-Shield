from fastapi import APIRouter, Depends, Request
from app.schemas.telemetry import TelemetryData, DetectionResponse
from app.core.deps import get_redis_pool
from app.core.ml_model import BehaviorModel
import uuid
import json
import time

router = APIRouter()

@router.post("/telemetry", response_model=DetectionResponse)
async def analyze_telemetry(data: TelemetryData, request: Request, redis_client=Depends(get_redis_pool)):
    """
    Analyze browser telemetry & behavioral biometrics to detect bots.
    Implements Athena Shield weighted confidence scoring.
    """
    flags = []
    fingerprint_score = 0.0
    honeypot_score = 0.0
    behavior_score = 0.0

    # 1. User-Agent & Static Fingerprinting
    ua = (data.user_agent or "").lower()
    if "headless" in ua:
        flags.append("headless_user_agent")
        fingerprint_score += 0.8
    if any(bot_id in ua for bot_id in ["bot", "crawl", "spider", "python-requests", "curl", "aiohttp", "postman"]):
        flags.append("known_bot_user_agent")
        fingerprint_score += 1.0

    # 2. Webdriver Detection
    if data.webdriver:
        flags.append("webdriver_detected")
        fingerprint_score += 0.9

    # 3. Environment & Screen Anomalies
    if data.screen_resolution in ["800x600", "0x0", ""] and data.hardware_concurrency < 2:
        flags.append("suspicious_environment")
        fingerprint_score += 0.4

    fingerprint_score = min(1.0, fingerprint_score)

    # 4. Honeypot Trap
    if data.honeypot_triggered:
        honeypot_score = 1.0
        flags.append("honeypot_triggered")

    # 5. Behavioral Biometrics (Mouse & Timing ML Analysis)
    if data.mouse_movements and len(data.mouse_movements) >= 2:
        model = BehaviorModel()
        ml_score, ml_flags = model.predict(data.mouse_movements)
        behavior_score = ml_score
        flags.extend(ml_flags)

    # Reaction Time Anomaly Check
    if data.time_on_page is not None and 0 < data.time_on_page < 60 and not data.mouse_movements:
        flags.append("superhuman_interaction_speed")
        behavior_score = max(behavior_score, 0.6)

    # Deduplicate flags
    flags = list(dict.fromkeys(flags))

    # 6. Weighted Confidence Scoring:
    # final_threat_score = (behavior_score * 0.5) + (honeypot_score * 1.0) + (fingerprint_score * 0.4)
    threat_score = min(1.0, (behavior_score * 0.5) + (honeypot_score * 1.0) + (fingerprint_score * 0.4))
    threat_score = round(threat_score, 2)

    # Action and Verdict determination
    if honeypot_score == 1.0 or fingerprint_score >= 0.8 or threat_score >= 0.5:
        verdict = "bot"
        action = "BLOCK" if threat_score >= 0.75 else "CHALLENGE"
        confidence = round(max(threat_score, 0.75 if "webdriver_detected" in flags else 0.55), 2)
    else:
        verdict = "human"
        action = "ALLOW"
        confidence = round(max(0.70, 1.0 - threat_score), 2)

    # Extract client IP
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Log event for real-time dashboard telemetry
    event = {
        "timestamp": time.time(),
        "verdict": verdict,
        "score": threat_score,
        "confidence": confidence,
        "action": action,
        "flags": flags,
        "ip": client_ip
    }
    
    try:
        await redis_client.lpush("recent_events", json.dumps(event))
        await redis_client.ltrim("recent_events", 0, 99)
    except Exception as e:
        print(f"Warning: Failed to log event to Redis: {e}")

    return DetectionResponse(
        verdict=verdict,
        confidence=confidence,
        flags=flags,
        request_id=str(uuid.uuid4()),
        action=action,
        scores={
            "threat_score": threat_score,
            "behavior_score": round(behavior_score, 2),
            "honeypot_score": round(honeypot_score, 2),
            "fingerprint_score": round(fingerprint_score, 2)
        }
    )
