from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.deps import get_redis_client

class RateLimiterMiddleware:
    def __init__(self, app, limit: int = 100, window: int = 60):
        self.app = app
        self.limit = limit
        self.window = window

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        client_ip = request.client.host if request.client else "127.0.0.1"
        key = f"rate_limit:{client_ip}"

        try:
            client = await get_redis_client()
            try:
                current = await client.incr(key)
                if current == 1:
                    await client.expire(key, self.window)

                if current > self.limit:
                    response = JSONResponse(
                        {"detail": "Rate limit exceeded. Too many requests."}, 
                        status_code=429
                    )
                    await response(scope, receive, send)
                    return
            finally:
                await client.close()
        except Exception:
            pass

        await self.app(scope, receive, send)
