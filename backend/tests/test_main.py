import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Athena Shield Defense System Online"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_telemetry_detects_bot_user_agent():
    payload = {
        "user_agent": "python-requests/2.28.0",
        "screen_resolution": "800x600",
        "timezone": "UTC",
        "language": "en-US",
        "platform": "Linux",
        "hardware_concurrency": 1,
        "webdriver": True,
        "honeypot_triggered": False
    }
    response = client.post("/api/v1/telemetry", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "bot"
    assert data["confidence"] >= 0.5
    assert "known_bot_user_agent" in data["flags"]
    assert "webdriver_detected" in data["flags"]

def test_telemetry_detects_honeypot_trap():
    payload = {
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "screen_resolution": "1920x1080",
        "timezone": "America/New_York",
        "language": "en-US",
        "platform": "Win32",
        "hardware_concurrency": 8,
        "webdriver": False,
        "honeypot_triggered": True
    }
    response = client.post("/api/v1/telemetry", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "bot"
    assert "honeypot_triggered" in data["flags"]

def test_telemetry_allows_human_traffic():
    from benchmark.run_benchmark import generate_human_path
    path = generate_human_path(20)
    human_mouse = [[p["x"], p["y"], p["timestamp"]] for p in path]
    payload = {
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "screen_resolution": "1920x1080",
        "timezone": "America/New_York",
        "language": "en-US",
        "platform": "Win32",
        "hardware_concurrency": 8,
        "webdriver": False,
        "mouse_movements": human_mouse,
        "time_on_page": 2500,
        "honeypot_triggered": False
    }
    response = client.post("/api/v1/telemetry", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "human"
    assert data["action"] == "ALLOW"

def test_stats_endpoint():
    response = client.get("/api/v1/stats")
    assert response.status_code == 200
    data = response.json()
    assert "recent_events" in data
    assert "summary" in data
    assert "total_requests" in data["summary"]
    assert "bot_count" in data["summary"]
    assert "human_count" in data["summary"]
    assert data["summary"]["total_requests"] >= 1
