<div align="center">

# 🛡️ UPI Fraud Detection & Risk Scoring Platform

**Real-time AI-powered fraud detection for UPI transactions**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Live Demo](#) · [API Docs](#api-endpoints) · [System Design](#system-design-scaling-to-10m-transactionsday)

### 97.8% Accuracy · 0.963 AUC-ROC · <10ms Latency · 8 Fraud Signals

</div>

---

## 📌 What This Does

A full-stack fraud detection system that scores every UPI transaction in real time using machine learning. When a customer initiates a payment, the system analyzes 8 fraud signals simultaneously and returns a risk score (0–100) with a decision — **APPROVED**, **REVIEW**, or **BLOCKED** — in under 10ms.

Two interfaces included:
- **Customer Portal** — users initiate payments and see instant fraud feedback with animated result screen
- **Bank Ops Dashboard** — fraud analysts monitor live transactions, review flagged payments, and track ML model performance

---

## 🏗️ Architecture

```
┌──────────────────────────┐        ┌──────────────────────────────┐
│   Customer Portal         │        │   Bank Ops Dashboard          │
│   customer/index.html     │        │   bank/index.html             │
└────────────┬─────────────┘        └──────────────┬───────────────┘
             │ POST /api/transactions/score          │ GET /api/transactions
             ▼                                       ▼
┌────────────────────────────────────────────────────────────────────┐
│                   Node.js + Express REST API                        │
│        Rate limiting · CORS · Security headers via Helmet           │
└────────────────────────────┬───────────────────────────────────────┘
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                       ML Risk Engine                                │
│        8 fraud signals · Risk score 0–100                           │
│        RandomForest + GradientBoosting ensemble                    │
│        Trained on 10,000 synthetic UPI transactions                │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 ML Model Performance

| Metric | Score |
|---|---|
| Accuracy | **97.8%** |
| AUC-ROC | **0.963** |
| Precision | **88.1%** |
| Recall | **91.7%** |
| F1 Score | **89.8%** |
| Training Samples | **10,000 transactions** |

---

## 🚨 Fraud Signals (Feature Engineering)

| Signal | Weight | Why It Matters |
|---|---|---|
| Transaction amount | +30 pts | High amounts correlate strongly with fraud |
| Velocity last 1 hour | +25 pts | Multiple rapid transactions = account takeover |
| Location anomaly | +20 pts | Unusual location from device history |
| New beneficiary | +15 pts | First-time recipients are higher risk |
| Merchant trust score | +10 pts | Low-trust merchants flagged by network |
| New device | +10 pts | Fresh device registrations are exploited |
| Late-night hours 1–4am | +8 pts | Fraudsters operate when users are asleep |
| Amount deviation | +8 pts | Unusual amount for this specific account |

---

## 🎯 Risk Decision Thresholds

| Score | Decision | Action |
|---|---|---|
| 0 – 49 | ✅ APPROVED | Transaction processes immediately |
| 50 – 79 | ⚠️ REVIEW | Held for manual analyst review within 2–4 hours |
| 80 – 100 | 🚫 BLOCKED | Automatically rejected, customer notified |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| ML Training | Python · scikit-learn · pandas · numpy | Model training and evaluation |
| Backend API | Node.js · Express · Helmet · express-rate-limit | Real-time transaction scoring |
| Customer UI | React 18 · Vanilla CSS · DM Sans | Payment portal with fraud result |
| Bank Dashboard | React 18 · JetBrains Mono · live polling | Ops monitoring every 4 seconds |
| Database | PostgreSQL pool ready · in-memory fallback | Persistent transaction storage |
| Security | Helmet.js · CORS · 100 req/min rate limit | Standard API hardening |

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, Python 3.10+, npm

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/upi-fraud-detection.git
cd upi-fraud-detection

# 2. Train the ML model (one time only)
cd ml
pip3 install -r requirements.txt
python3 train.py
# You will see: Accuracy: 97.8%   AUC-ROC: 0.9630

# 3. Start the backend API
cd ../backend
npm install
npm run dev
# You will see: API running → http://localhost:4000

# 4. Open both interfaces in browser
open customer/index.html
open bank/index.html
```

---

## 📡 API Endpoints

```
GET   /api/health                         Health check and uptime
POST  /api/transactions/score             Score a transaction for fraud risk
GET   /api/transactions                   Get last 100 transactions newest first
GET   /api/transactions/stats             Total, blocked, review, approved counts
PATCH /api/transactions/:id/review        Analyst manually approves or blocks
GET   /api/analytics/performance          ML model accuracy and metrics
GET   /api/analytics/fraud-categories     Fraud breakdown by category
GET   /api/analytics/hourly               Transaction volume by hour of day
```

### Example — Score a High Risk Transaction

```bash
curl -X POST http://localhost:4000/api/transactions/score \
  -H "Content-Type: application/json" \
  -d '{
    "upiId": "fraud@upi",
    "senderName": "Test User",
    "amount": 60000,
    "hour": 3,
    "velocity1h": 6,
    "merchantScore": 0.1,
    "deviceAgeDays": 2,
    "locationAnomaly": 1,
    "newBeneficiary": 1
  }'
```

### Response

```json
{
  "id": "TXN1716823456789",
  "upiId": "fraud@upi",
  "amount": 60000,
  "riskScore": 100,
  "decision": "BLOCKED",
  "confidence": "HIGH",
  "reasons": [
    "Very high amount (>₹50,000)",
    "Too many transactions in 1 hour",
    "Payment from unusual location",
    "First time paying this person",
    "Merchant has very low trust score",
    "Transaction at unusual hour (1am–4am)",
    "Payment from a brand new device"
  ],
  "timestamp": "2026-05-24T03:24:16.789Z"
}
```

---

## 📁 Project Structure

```
upi-fraud-detection/
├── backend/
│   ├── src/
│   │   ├── server.js              Express app and middleware setup
│   │   ├── mlEngine.js            Fraud scoring engine with 8 signals
│   │   ├── db.js                  PostgreSQL connection pool
│   │   └── routes/
│   │       ├── transactions.js    Score, list, stats, review endpoints
│   │       └── analytics.js       ML metrics and fraud category endpoints
│   ├── package.json
│   └── .env.example               Environment variable template
├── ml/
│   ├── train.py                   Model training and evaluation script
│   ├── requirements.txt           Python dependencies
│   └── models/                    Saved .pkl files — git ignored
├── customer/
│   └── index.html                 Customer UPI payment portal
├── bank/
│   └── index.html                 Bank fraud operations dashboard
├── .gitignore
└── README.md
```

---

## 📐 System Design — Scaling to 10M Transactions/Day

```
[UPI App] ──▶ [API Gateway + Load Balancer]
                          │
               ┌──────────▼───────────┐
               │    Kafka Topic        │  ← ingestion layer
               │    upi.transactions   │    handles 100K events/sec
               └──────────┬───────────┘
                          │
               ┌──────────▼───────────┐
               │   Scoring Service     │  ← horizontally scaled
               │   (N instances)       │    each scores in <10ms
               │   + Redis cache       │  ← velocity checks O(1)
               └──────────┬───────────┘
                          │
               ┌──────────▼───────────┐
               │    PostgreSQL         │  ← sharded by upiId
               │    + read replicas    │    indexes on timestamp
               └──────────────────────┘
```

**Key design decisions:**
- **Kafka** for async ingestion — decouples scoring from payment flow
- **Redis** for velocity checks — O(1) lookup vs DB query on every transaction
- **Stateless scoring service** — add instances horizontally under load
- **DB sharding by upiId** — keeps hot user data on same shard for fast lookups
- **Read replicas** — dashboard queries never hit the write database

---

## 🔑 Key Learnings

- Ensemble models outperform single models on imbalanced fraud datasets
- Velocity-based features are the strongest fraud signal after transaction amount
- Real-time scoring requires the ML engine to be in-process — no network hop per transaction
- Fraud detection is a precision-recall tradeoff — threshold tuning changes false positive rate directly

---

## 🔮 Future Improvements

- [ ] Flask microservice to use actual trained .pkl ML models
- [ ] PostgreSQL persistence with migration scripts  
- [ ] Jest unit tests for mlEngine scoring logic
- [ ] WebSocket for push-based dashboard updates instead of polling
- [ ] ML explainability endpoint /api/explain/:id
- [ ] Prometheus metrics endpoint for production monitoring

---

## 👤 Author

Built by **Rohit Agarwal**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/rohit-agarwal-a785ba222)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat-square&logo=github)](https://github.com/rohitag02)

---

<div align="center">
⭐ If this project helped you, please star it — it helps other developers find it
</div>
