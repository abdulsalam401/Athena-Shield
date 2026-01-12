# Athena Shield Threat Model

## 1. System Overview
Athena Shield protects web applications by analyzing client telemetry and enforcing rate limits. It assumes trust in the Backend API and Redis store.

## 2. Attack Vectors

### A. Telemetry Spoofing
- **Risk**: Attackers can modify client-side JavaScript to send "clean" telemetry.
- **Mitigation**:
    - **Header Analysis**: Compare User-Agent with TCP/HTTP headers (Backend).
    - **Behavioral Analysis**: Track mouse/keyboard events (Planned Phase 2).
    - **Honeytokens**: Hidden fields that only scripts interact with (Planned Phase 2).

### B. Replay Attacks
- **Risk**: Capturing a valid "human" payload and resending it.
- **Mitigation**:
    - **Nonce/Timestamp**: Payloads include timestamps (checked for freshness).
    - **Rate Limiting**: Duplicate IPs are throttled.

### C. API Flooding
- **Risk**: Denial of Service (DoS) against the detection endpoint.
- **Mitigation**:
    - **Redis Rate Limiter**: 100 requests / 60s bucket per IP.
    - Fail-open design (if Redis dies, traffic flows but logging persists).

## 3. Design Decisions

### Fingerprinting vs CAPTCHA
We prioritized **passive protection** (fingerprinting) over active intrusion (CAPTCHA) to minimize UX friction.

### Why Redis?
Low-latency writes are critical for rate limiting. Redis provides atomic increments needed for the sliding window algorithm.
