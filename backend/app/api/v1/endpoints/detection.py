from fastapi import APIRouter, Depends, BackgroundTasks
from app.schemas.telemetry import TelemetryData, DetectionResponse
from app.core.deps import get_redis_pool
from app.core.ml_model import BehaviorModel
import uuid
import json
import time

router = APIRouter()

@router.post("/telemetry", response_model=DetectionResponse)
async def analyze_telemetry(data: TelemetryData, redis_client=Depends(get_redis_pool)):
    """
    Analyze browser telemetry to detect bots.
    """
    flags = []
    score = 0.0
    
    # ... (Logic)
    
    # 1. User-Agent Analysis
    ua = data.user_agent.lower()
    if "headless" in ua:
        flags.append("headless_user_agent")
        score += 0.8
    if "bot" in ua or "crawl" in ua:
        flags.append("known_bot_user_agent")
        score += 1.0

    # 2. Webdriver Detection
    if data.webdriver:
        flags.append("webdriver_detected")
        score += 0.9


    # Helper to log event
    async def log_event(verdict, score, flags):
        event = {
            "timestamp": time.time(),
            "verdict": verdict,
            "score": score,
            "flags": flags,
            "ip": "127.0.0.1"
        }
        await redis_client.lpush("recent_events", json.dumps(event))
        await redis_client.ltrim("recent_events", 0, 99)

    # 3. Behavioral Analysis (Phase 2)
    # HONEYPOT CHECK (Critical)
    if data.honeypot_triggered:
        # Log before returning
        await log_event("bot", 1.0, flags + ["honeypot_triggered"])
        
        return DetectionResponse(
            verdict="bot",
            confidence=1.0,
            flags=flags + ["honeypot_triggered"],
            request_id=str(uuid.uuid4())
        )

    # ML BEHAVIOR ANALYSIS
    model = BehaviorModel()
    ml_score, ml_flags = model.predict(data.mouse_movements)
    flags.extend(ml_flags)

    # Combine scores
    # Basic signals
    if data.time_on_page and data.time_on_page > 1000:
        score += 0.0 # Time is neutral, but short time is bad?
    else:
        # Too fast?
        pass # Keep simple

    # Adjust confidence
    if "headless_browser" in flags or "webdriver_detected" in flags:
        confidence = 0.95
        verdict = "bot"
    elif ml_score > 0.5: # ML detected robotic movement
        confidence = min(0.9, 0.5 + ml_score)
        verdict = "bot"
    elif "bot_user_agent" in flags:
        confidence = 0.9
        verdict = "bot"
    else:
        # Fallback
        confidence = 0.0 # Low confidence it's a bot -> It's a human
        verdict = "human"

    # Screen resolution vs hardware concurrency
    if data.screen_resolution == "800x600" and data.hardware_concurrency < 2:
        flags.append("suspicious_environment")
        score += 0.4

    # Log standard event
    await log_event(verdict, confidence, flags)
    
    return DetectionResponse(
        verdict=verdict,
        confidence=confidence,
        flags=flags,
        request_id=str(uuid.uuid4())
    )
    
    return DetectionResponse(
        verdict=verdict,
        confidence=final_score,
        flags=flags,
        request_id=str(uuid.uuid4())
    )
