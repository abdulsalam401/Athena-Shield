import time
import json
import asyncio

class MockRedis:
    _data = {} # Shared state
    _expirations = {}

    def __init__(self):
        print("⚠️  USING MOCK REDIS (SHARED)")

    async def incr(self, key: str):
        val = self._data.get(key, 0)
        self._data[key] = val + 1
        return self._data[key]

    async def expire(self, key: str, seconds: int):
        self._expirations[key] = time.time() + seconds
        return True

    async def lpush(self, key: str, value: str):
        if key not in self._data:
            self._data[key] = []
        self._data[key].insert(0, value)
        return len(self._data[key])

    async def ltrim(self, key: str, start: int, end: int):
        if key in self._data:
            self._data[key] = self._data[key][start : end + 1]
        return True

    async def lrange(self, key: str, start: int, end: int):
        if key not in self._data:
            return []
        return self._data[key][start : end + 1 if end != -1 else None]

    async def close(self):
        pass
