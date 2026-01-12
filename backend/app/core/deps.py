import redis.asyncio as redis
from app.core.config import settings
from app.core.mock_redis import MockRedis

async def get_redis_pool():
    try:
        # Test connection
        client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1)
        await client.ping()
        yield client
        await client.close()
    except Exception as e:
        # Fallback to Mock
        yield MockRedis()
