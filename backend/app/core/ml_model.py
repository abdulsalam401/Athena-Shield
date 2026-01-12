
import numpy as np
from sklearn.ensemble import IsolationForest
import math

class BehaviorModel:
    def __init__(self):
        # We can eventually load a trained model using joblib
        # For now, we will use a heuristic-based approach with 'online' anomaly detection capabilities
        # Or simply calculate features and apply strict thresholds based on 'Smart Bot' observations
        self.clf = IsolationForest(contamination=0.1) 
        self._is_trained = False

    def extract_features(self, mouse_movements):
        """
        Convert raw mouse points [[x, y, t], ...] into a feature vector.
        Features:
        1. Avg Speed
        2. Std Dev Speed (Variance)
        3. Straightness (Linearity)
        4. Avg Acceleration
        """
        if not mouse_movements or len(mouse_movements) < 2:
            return [0, 0, 0, 0]

        points = np.array(mouse_movements)
        # Calculate distances and times
        deltas = np.diff(points, axis=0) # [[dx, dy, dt], ...]
        dists = np.sqrt(deltas[:, 0]**2 + deltas[:, 1]**2)
        times = deltas[:, 2]

        # Avoid division by zero
        times[times == 0] = 1.0 

        speeds = dists / times
        
        avg_speed = np.mean(speeds)
        std_speed = np.std(speeds)
        
        # Acceleration
        accels = np.diff(speeds)
        avg_accel = np.mean(np.abs(accels))

        # Straightness / Efficiency
        # Sum of Euclidean dists / Euclidean dist of endpoints
        total_dist = np.sum(dists)
        if total_dist == 0:
            straightness = 0
        else:
            p_start = points[0]
            p_end = points[-1]
            endpoint_dist = math.sqrt((p_end[0] - p_start[0])**2 + (p_end[1] - p_start[1])**2)
            straightness = endpoint_dist / total_dist

        return [avg_speed, std_speed, avg_accel, straightness]

    def predict(self, mouse_movements):
        """
        Return anomaly score. 
        Higher score = More likely Human (normal).
        Lower score = More likely Bot (anomalous).
        
        Since we don't have a trained model, we will use Heuristic Logic 
        derived from our 'Smart Bot' observations.
        """
        features = self.extract_features(mouse_movements)
        avg_speed, std_speed, avg_accel, straightness = features

        score = 0
        flags = []

        # 1. Variance Check
        # Bots (even smart ones) often move at constant speeds or perfect curves
        # Humans have high variance (jitter)
        # Puppeteer 'steps' create very uniform speed segments
        if std_speed < 2.0: # Previously 0.1, increasing sensitivity. Humans are very jerky.
            flags.append("robotic_speed_uniformity")
            score += 0.6 
        
        # 2. Speed limit
        if avg_speed > 3.0: # Lowered from 5.0
            flags.append("superhuman_speed")
            score += 0.8

        # 3. Straightness
        # Lowered threshold. Real mouse paths effectively always wind a bit.
        if straightness > 0.95 and len(mouse_movements) > 5:
            flags.append("perfect_straight_line")
            score += 0.7
            
        return score, flags
