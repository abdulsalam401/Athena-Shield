from fastapi import APIRouter, Depends
from app.core.deps import get_redis_pool
import json

router = APIRouter()

@router.get("/stats")
async def get_stats(redis_client=Depends(get_redis_pool)):
    """
    Get recent detection events for the dashboard.
    """
    events = await redis_client.lrange("recent_events", 0, 99)
    parsed_events = [json.loads(e) for e in events]
    
    # Calculate basic aggregated stats
    total = len(parsed_events)
    bots = sum(1 for e in parsed_events if e['verdict'] == 'bot')
    
    return {
        "recent_events": parsed_events,
        "summary": {
            "total_requests": total,
            "bot_count": bots,
            "human_count": total - bots
        }
    }
