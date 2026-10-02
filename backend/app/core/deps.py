import time
import logging
import redis.asyncio as redis
from app.core.config import settings
from app.core.mock_redis import MockRedis

logger = logging.getLogger("athena.shield")

_redis_available = None
_last_check = 0.0

async def get_redis_client():
    global _redis_available, _last_check
    now = time.time()

    if getattr(settings, 'USE_MOCK_REDIS', False):
        return MockRedis()

    # If Redis check failed recently, don't wait on socket connect timeout
    if _redis_available is False and (now - _last_check < 30.0):
        return MockRedis()

    try:
        client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=0.2)
        await client.ping()
        _redis_available = True
        return client
    except Exception:
        if _redis_available is not False:
            print("INFO:     Redis server not detected. Using built-in high-performance MockRedis.")
        _redis_available = False
        _last_check = now
        return MockRedis()

async def get_redis_pool():
    client = await get_redis_client()
    try:
        yield client
    finally:
        await client.close()
