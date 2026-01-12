from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class TelemetryData(BaseModel):
    user_agent: str
    screen_resolution: str
    timezone: str
    language: str
    platform: str
    hardware_concurrency: int
    device_memory: Optional[float] = None
    webdriver: bool
    canvas_hash: Optional[str] = None
    webgl_vendor: Optional[str] = None
    webgl_renderer: Optional[str] = None
    
    # Behavioral Data (Phase 2)
    mouse_movements: Optional[list[list[float]]] = [] 
    keystrokes: Optional[list[list[Any]]] = []
    time_on_page: Optional[int] = 0
    honeypot_triggered: bool = False

    # Extended signals
    plugins: Optional[list[str]] = []
    headers: Optional[Dict[str, str]] = {}
    
    class Config:
        schema_extra = {
            "example": {
                "user_agent": "Mozilla/5.0...",
                "screen_resolution": "1920x1080",
                "timezone": "UTC",
                "language": "en-US",
                "platform": "Win32",
                "hardware_concurrency": 8,
                "webdriver": False
            }
        }

class DetectionResponse(BaseModel):
    verdict: str = Field(..., description="'human' or 'bot'")
    confidence: float = Field(..., ge=0.0, le=1.0)
    flags: list[str] = []
    request_id: str
