import sys
import os
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

# Add parent directory to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.ml_model import BehaviorModel

def generate_linear_path(n_points=20):
    """Simulate a bot: Perfectly straight line with constant speed."""
    start = np.random.rand(2) * 800
    end = np.random.rand(2) * 800
    
    # Linear interpolation
    t = np.linspace(0, 1, n_points)
    x = start[0] + (end[0] - start[0]) * t
    y = start[1] + (end[1] - start[1]) * t
    
    # Constant time intervals (robotic speed)
    timestamps = np.linspace(0, 1000, n_points)
    
    return [{"x": x[i], "y": y[i], "timestamp": timestamps[i]} for i in range(n_points)]

def generate_human_path(n_points=20):
    """Simulate a human: Curves (Bezier-like) and variable speed."""
    start = np.random.rand(2) * 800
    end = np.random.rand(2) * 800
    control = np.random.rand(2) * 800 # Random control point for curve
    
    t = np.linspace(0, 1, n_points)
    
    # Quadratic Bezier
    x = (1-t)**2 * start[0] + 2*(1-t)*t * control[0] + t**2 * end[0]
    y = (1-t)**2 * start[1] + 2*(1-t)*t * control[1] + t**2 * end[1]
    
    # Add noise (tremor)
    x += np.random.normal(0, 2, n_points) 
    y += np.random.normal(0, 2, n_points)
    
    # Variable timing (accel/decel)
    timestamps = np.power(t, 2) * 1000 # Exponential time (acceleration)
    
    return [{"x": x[i], "y": y[i], "timestamp": timestamps[i]} for i in range(n_points)]

def run_benchmark():
    print("🧪 Generating Synthetic Dataset (n=1000)...")
    
    model = BehaviorModel()
    y_true = []
    y_pred = []
    
    # 1. Generate 500 Bots
    for _ in range(500):
        path = generate_linear_path()
        score, _ = model.predict(path)
        # Verdict: 1 if Bot (score > 0.5), 0 if Human
        prediction = 1 if score > 0.5 else 0
        y_true.append(1)
        y_pred.append(prediction)
        
    # 2. Generate 500 Humans
    for _ in range(500):
        path = generate_human_path()
        score, _ = model.predict(path)
        prediction = 1 if score > 0.5 else 0
        y_true.append(0)
        y_pred.append(prediction)
        
    print("\n📊 Benchmark Results:")
    print("--------------------------------------------------")
    print(classification_report(y_true, y_pred, target_names=["Human", "Bot"]))
    
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    print(f"Confusion Matrix:")
    print(f"True Negatives (Correct Humans): {tn}")
    print(f"False Positives (Humans flagged as Bots): {fp}")
    print(f"False Negatives (Bots missed): {fn}")
    print(f"True Positives (Caught Bots): {tp}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    run_benchmark()
