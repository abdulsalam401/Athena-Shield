from fastapi import APIRouter, Depends
from app.core.deps import get_redis_pool
import json
import time

router = APIRouter()

@router.get("/stats")
async def get_stats(redis_client=Depends(get_redis_pool)):
    """
    Get aggregated statistics and recent threat events for the Overwatch Dashboard.
    """
    try:
        events = await redis_client.lrange("recent_events", 0, 99)
    except Exception:
        events = []

    parsed_events = []
    for e in events:
        try:
            if isinstance(e, str):
                parsed_events.append(json.loads(e))
            elif isinstance(e, dict):
                parsed_events.append(e)
        except Exception:
            continue
    
    total = len(parsed_events)
    bots = sum(1 for e in parsed_events if e.get('verdict') == 'bot')
    humans = total - bots
    
    # Recent threat rate (percentage of requests identified as bots)
    threat_rate = round((bots / total * 100), 1) if total > 0 else 0.0

    return {
        "recent_events": parsed_events,
        "summary": {
            "total_requests": total,
            "bot_count": bots,
            "human_count": humans,
            "threat_rate_percent": threat_rate
        },
        "system_status": {
            "engine": "Athena Cortex v1.0",
            "uptime": "online",
            "timestamp": time.time()
        }
    }

@router.post("/stats/reset")
async def reset_stats(redis_client=Depends(get_redis_pool)):
    """
    Reset activity history (useful for clean testing demonstrations).
    """
    try:
        await redis_client.delete("recent_events")
        return {"status": "success", "message": "Activity log cleared."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
