from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Any, Optional, List

class TelemetryData(BaseModel):
    user_agent: str = ""
    screen_resolution: str = "1920x1080"
    timezone: str = "UTC"
    language: str = "en-US"
    platform: str = "Win32"
    hardware_concurrency: int = 4
    device_memory: Optional[float] = None
    webdriver: bool = False
    canvas_hash: Optional[str] = None
    webgl_vendor: Optional[str] = None
    webgl_renderer: Optional[str] = None
    
    # Behavioral Data
    mouse_movements: Optional[List[Any]] = [] 
    keystrokes: Optional[List[Any]] = []
    time_on_page: Optional[int] = 0
    honeypot_triggered: bool = False

    # Extended signals
    plugins: Optional[List[str]] = []
    headers: Optional[Dict[str, str]] = {}
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
                "screen_resolution": "1920x1080",
                "timezone": "UTC",
                "language": "en-US",
                "platform": "Win32",
                "hardware_concurrency": 8,
                "webdriver": False,
                "mouse_movements": [[100, 150, 1700000000000], [105, 158, 1700000000100]],
                "time_on_page": 2500,
                "honeypot_triggered": False
            }
        }
    )

class DetectionResponse(BaseModel):
    verdict: str = Field(..., description="'human' or 'bot'")
    confidence: float = Field(..., ge=0.0, le=1.0)
    flags: List[str] = []
    request_id: str
    action: Optional[str] = Field("ALLOW", description="'ALLOW', 'CHALLENGE', or 'BLOCK'")
    scores: Optional[Dict[str, float]] = None
