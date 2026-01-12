from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import redis.asyncio as redis
import time
import time
from app.core.config import settings
from app.core.mock_redis import MockRedis

class RateLimiterMiddleware:
    def __init__(self, app, limit: int = 100, window: int = 60):
        self.app = app
        self.limit = limit
        self.window = window
        # Lazy connect in call or use dependency logic? 
        # For simplicity, we create a client but handle connection errors in __call__
        # However, for the mock to work globally, we need shared state if we want stats to persist across reqs in mock mode.
        # But MockRedis is per-instance if not singleton.
        # Let's use a simpler approach: Middleware uses the global dependency mechanism or just fails open.
        self.redis_url = settings.REDIS_URL

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"

        try:
            # Create a localized client or use dependency? 
            # Ideally we reuse the pool. 
            client = redis.from_url(self.redis_url, decode_responses=True, socket_connect_timeout=1)
            
            try:
                current = await client.incr(key)
                if current == 1:
                    await client.expire(key, self.window)
                
                if current > self.limit:
                    await client.close()
                    response = JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
                    await response(scope, receive, send)
                    return
            finally:
                await client.close()

        except Exception:
            # Fallback to Mock if Redis fails
            try:
                # Use MockRedis which shares state
                mock_client = MockRedis()
                current = await mock_client.incr(key)
                if current == 1:
                    await mock_client.expire(key, self.window)
            except:
                pass 

        await self.app(scope, receive, send)
