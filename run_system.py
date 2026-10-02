"""
Athena Shield • Unified Platform Launcher
Orchestrates Cortex Backend, Overwatch UI Dashboard, and Biometrics Test Lab.
"""
import sys
import os
import subprocess
import time
import webbrowser
import signal

# Safe console encoding for Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
DASHBOARD_DIR = os.path.join(ROOT_DIR, "dashboard")

processes = []

def cleanup(sig=None, frame=None):
    print("\n🛑 Shutting down Athena Shield defense processes...")
    for p in processes:
        try:
            p.terminate()
            p.kill()
        except Exception:
            pass
    print("✅ All services stopped.")
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def start_backend():
    print("🧠 Starting Cortex Engine Backend (FastAPI on http://localhost:8000)...")
    cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"]
    p = subprocess.Popen(cmd, cwd=BACKEND_DIR)
    processes.append(p)
    return p

def start_test_lab():
    print("🧪 Starting Biometrics Lab Server (HTTP on http://localhost:5500)...")
    cmd = [sys.executable, "-m", "http.server", "5500", "--bind", "127.0.0.1"]
    p = subprocess.Popen(cmd, cwd=ROOT_DIR)
    processes.append(p)
    return p

def start_dashboard():
    print("👁️ Starting Overwatch UI Dashboard (Vite on http://localhost:5173)...")
    # On Windows, npm is a cmd script
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    cmd = [npm_cmd, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"]
    p = subprocess.Popen(cmd, cwd=DASHBOARD_DIR)
    processes.append(p)
    return p

def main():
    print("=" * 65)
    print("🛡️  ATHENA SHIELD • NEXT-GEN BOT DEFENSE PLATFORM")
    print("=" * 65)

    start_backend()
    time.sleep(1.5)

    start_test_lab()
    time.sleep(0.5)

    start_dashboard()
    time.sleep(2)

    print("\n" + "=" * 65)
    print("🚀 ALL SYSTEMS ONLINE & OPERATIONAL")
    print("=" * 65)
    print("  • Overwatch Dashboard:    http://localhost:5173")
    print("  • Biometrics Test Lab:    http://localhost:5500/test_page.html")
    print("  • Cortex API Docs:        http://localhost:8000/docs")
    print("  • Health Check:           http://localhost:8000/health")
    print("=" * 65)
    print("Press Ctrl+C to terminate all services.\n")

    # Keep alive
    try:
        while True:
            time.sleep(1)
            for p in processes:
                if p.poll() is not None:
                    # One of the processes crashed
                    print(f"⚠️ Process {p.args} exited with code {p.returncode}")
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
