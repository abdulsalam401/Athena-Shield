<div align="center">

  <img src="https://img.shields.io/badge/🛡️%20Values-Protected-32CD32?style=for-the-badge" alt="Values">
  <br />
  <br />

  <h1>🛡️ Athena Shield</h1>
  <p>
    <b>The Next-Generation Bot & Fraud Detection Platform.</b>
  </p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-detection-logic">Detection Logic</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=python&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/ML-Scikit--Learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white" alt="ML" />
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

---

## ⚡ Overview

**Athena Shield** is a research-grade security platform designed to detect and mitigate sophisticated automated threats. Moving beyond simple IP blocking, it employs a multi-layered defense strategy combining:

*   **Behavioral Biometrics**: Analyzes mouse kinematics (curvature, entropy, speed) to distinguish human jitter from robotic linearity.
*   **Honeypot Traps**: Invisible UI elements that tempt bots into revealing themselves.
*   **Machine Learning**: Anomaly detection engine trained to identify "superhuman" interaction patterns.
*   **Browser Fingerprinting**: Identifies headless environments (Puppeteer, Selenium) via canvas and subtle rendering differences.

<br />

## 🛡️ Architecture

Built on a high-performance **Microservices** architecture for scalability and resilience.

| Component | Tech Stack | Responsibility |
|:--- |:--- |:--- |
| **🧠 Cortex Engine** | Python, FastAPI, Scikit-Learn | The brain. Processes telemetry, runs ML inference, and issues verdicts. |
| **👁️ Overwatch UI** | React, Vite, Recharts | Real-time operations dashboard. Visualizes threat scores and attack vectors. |
| **🕸️ Sentinel SDK** | TypeScript, JavaScript | Lightweight client library (~12kb). Collects behavioral data and fingerprints. |
| **🧱 Fortress Data** | Redis, Docker | High-speed sliding window rate limiting and event aggregation. |

<br />

## 🚀 Getting Started

Deploy the entire stack in under 2 minutes using Docker.

### Prerequisites
*   Docker & Docker Compose
*   (Optional) Node.js & Python for local dev

### 📦 One-Click Deployment

```bash
# 1. Clone the repository
git clone https://github.com/your-username/athena-shield.git
cd athena-shield

# 2. Launch the Fortress 🛡️
sudo docker-compose up --build -d
```

### 🚦 Verification
*   **Dashboard**: Visit `http://localhost`
*   **API Documentation**: Visit `http://localhost:8000/docs`

<br />

## 🧠 Detection Logic (The "Secret Sauce")

Athena Shield uses a **Weighted Confidence Scoring** system. It doesn't just block IPs; it builds a profile.

```python
final_score = (
    (behavior_score * 0.5) +   # ML: Mouse Jitter, Path Efficiency
    (honeypot_score * 1.0) +   # Critical: Hidden Field Interaction
    (fingerprint_score * 0.3)  # Headless Browser Traits
)

if final_score > 0.8:
    action = "BLOCK"
elif final_score > 0.5:
    action = "CHALLENGE" (CAPTCHA)
```

### 🧬 ML Capabilities
*   **Mouse Variance**: Humans have micro-tremors; bots move in perfect Bezier curves.
*   **Time-to-Action**: Analyzes reaction times. <50ms reactions are flagged as "Superhuman".

<br />

## ⚔️ Attack Simulator

We verify our defenses against our own offensive tools.

*   `dumb_bot.py`: Basic requests script (Caught by User-Agent).
*   `smart_bot.js`: Advanced **Puppeteer Stealth** bot designed to mimic humans.
    *   *Result*: Originally bypassed V1, now caught by **Behavioral ML** (See `docs/evasion-log.md`).

<br />

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <b>Built with 💻 & 🛡️ by Abdul Salam</b>
</div>
