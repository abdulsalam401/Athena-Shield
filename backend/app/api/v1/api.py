from fastapi import APIRouter
from app.api.v1.endpoints import detection, stats

api_router = APIRouter()
api_router.include_router(detection.router, tags=["detection"])
api_router.include_router(stats.router, tags=["stats"])
