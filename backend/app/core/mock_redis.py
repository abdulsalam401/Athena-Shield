import time
import json
import asyncio
from typing import Dict, Any, List, Optional

class MockRedis:
    """
    In-memory async Mock Redis client for Athena Shield.
    Provides identical interface to redis.asyncio.Redis for development and test environments.
    """
    _instance = None
    _data: Dict[str, Any] = {}
    _expirations: Dict[str, float] = {}

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(MockRedis, cls).__new__(cls)
            cls._data = {}
            cls._expirations = {}
        return cls._instance

    async def ping(self) -> bool:
        return True

    async def incr(self, key: str) -> int:
        self._clean_expired(key)
        val = int(self._data.get(key, 0))
        val += 1
        self._data[key] = val
        return val

    async def get(self, key: str) -> Optional[str]:
        if self._is_expired(key):
            return None
        return self._data.get(key)

    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        self._data[key] = value
        if ex is not None:
            self._expirations[key] = time.time() + ex
        elif key in self._expirations:
            del self._expirations[key]
        return True

    async def expire(self, key: str, seconds: int) -> bool:
        self._expirations[key] = time.time() + seconds
        return True

    async def lpush(self, key: str, value: str) -> int:
        self._clean_expired(key)
        if key not in self._data or not isinstance(self._data[key], list):
            self._data[key] = []
        self._data[key].insert(0, value)
        return len(self._data[key])

    async def ltrim(self, key: str, start: int, end: int) -> bool:
        self._clean_expired(key)
        if key in self._data and isinstance(self._data[key], list):
            if end == -1:
                self._data[key] = self._data[key][start:]
            else:
                self._data[key] = self._data[key][start : end + 1]
        return True

    async def lrange(self, key: str, start: int, end: int) -> List[str]:
        self._clean_expired(key)
        if key not in self._data or not isinstance(self._data[key], list):
            return []
        if end == -1:
            return list(self._data[key][start:])
        return list(self._data[key][start : end + 1])

    async def delete(self, *keys: str) -> int:
        deleted = 0
        for k in keys:
            if k in self._data:
                del self._data[k]
                deleted += 1
            if k in self._expirations:
                del self._expirations[k]
        return deleted

    async def flushdb(self) -> bool:
        self._data.clear()
        self._expirations.clear()
        return True

    async def close(self) -> None:
        pass

    def _is_expired(self, key: str) -> bool:
        if key in self._expirations and time.time() > self._expirations[key]:
            if key in self._data:
                del self._data[key]
            del self._expirations[key]
            return True
        return False

    def _clean_expired(self, key: str) -> None:
        self._is_expired(key)
