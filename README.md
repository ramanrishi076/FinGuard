# FinGuard 🛡️ — AI-Powered Instant Digital Wallet & Real-Time Fraud Detection Engine

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-1.6-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-Author%20Attribution-blue.svg)](LICENSE)

FinGuard is a full-stack, enterprise-grade digital payment and wallet platform modeled after the **Google Pay** design system. It combines deterministic heuristic business rules with an explainable, in-line **Machine Learning Probabilistic Risk Engine** that evaluates transactions in **< 0.1ms** with zero external runtime dependencies.

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [Project Phases & Delivery Timeline](#-project-phases--delivery-timeline)
- [Visual Testimony & Feature Showcases](#-visual-testimony--feature-showcases)
  - [Showcase 1: Google Pay Aesthetic User Interface](#showcase-1-google-pay-aesthetic-user-interface)
  - [Showcase 2: Multi-Bank Account Management & Vector Emblems](#showcase-2-multi-bank-account-management--vector-emblems)
  - [Showcase 3: Real-Time Fraud Interception & Explainable AI (XAI)](#showcase-3-real-time-fraud-interception--explainable-ai-xai)
  - [Showcase 4: Compliance Operations Hub & Audit Queue](#showcase-4-compliance-operations-hub--audit-queue)
  - [Showcase 5: Transaction Audit & Multi-Format Statement Exports](#showcase-5-transaction-audit--multi-format-statement-exports)
- [System Architecture](#-system-architecture)
- [Machine Learning Pipeline & Benchmarks](#-machine-learning-pipeline--benchmarks)
- [Local Installation & Setup Guide](#-local-installation--setup-guide)
- [Security & Architectural Highlights](#-security--architectural-highlights)

---

## 🚀 Executive Overview

Modern payment switches like **NPCI UPI, Pix, and FedNow** settle transactions irreversibly within 2 to 3 seconds. Conventional batch fraud screening systems evaluate transaction logs after settlement, failing to prevent fund depletion.

FinGuard introduces a **Hybrid In-Line Fraud Mitigation Engine**:
1. **Deterministic Guardrails:** Immediate enforcement of business logic (extreme velocities, unlinked wallets, single-transaction limits).
2. **Probabilistic ML Scoring:** Sub-millisecond standardized logistic inference trained on a 100k transaction corpus that scores balance drain ratios, off-hours anomalies, and micro-probing smurfing.
3. **Zero-Dependency Native Runtime:** Model coefficients, scaler parameters, and intercept weights are exported to JSON and executed natively within Node.js, eliminating external Python microservice latency.
4. **Explainable AI (XAI):** Every blocked or reviewed transaction yields an array of human-readable risk triggers for instant regulatory audit readiness.

---

## 📅 Project Phases & Delivery Timeline

The platform was engineered systematically in 7 distinct development phases:

| Phase | Milestone & Scope | Completion Date | Key Technical Deliverables |
| :---: | :--- | :---: | :--- |
| **Phase 1** | **Core Architecture & Authentication** | **Sep 14, 2026** | Express 5 server, bcrypt password hashing, stateless JSON Web Token (JWT) pipeline. |
| **Phase 2** | **Relational Schema & Session Management** | **Sep 15, 2026** | PostgreSQL schema via Prisma ORM, refresh token rotation, active session revocation. |
| **Phase 3** | **Wallet Ledger & Peer-to-Peer Transfers** | **Sep 15, 2026** | ACID transactional wallet balance transfers, BigInt currency precision, deposits & withdrawals. |
| **Phase 4** | **Deterministic Heuristic Fraud Shield** | **Sep 16, 2026** | 4-tier risk heuristic engine (velocity spikes, high amounts, zero-balance depletion, off-hours). |
| **Phase 5** | **Machine Learning Fraud Engine & Pipeline** | **Sep 28, 2026** | 100,000 synthetic dataset generation (`generate_dataset.py`), scikit-learn models, zero-dependency native Node.js inference engine (`mlPredictor.js`). |
| **Phase 6** | **High-Performance Caching & WebSockets** | **Sep 28, 2026** | Socket.IO bi-directional streaming for live alerts, resilient in-memory caching with Redis support. |
| **Phase 7** | **React Desktop UI, Multi-Bank & Vector Emblems** | **Sep 28 – Oct 7, 2026** | Vite + React 19 UI with Google Pay theme, 35+ bank directory, custom SVG vector logos, 6-digit PIN modal, PDF/Excel export, and vectorized dataset pipeline. |

---

## 📸 Visual Testimony & Feature Showcases

### Showcase 1: Google Pay Aesthetic User Interface
FinGuard implements a modern, accessible interface with comprehensive Light and Dark theme modes, dynamic color accents, quick-pay recipient avatars, and instant balance monitoring.

| Light Mode Experience | Dark Mode Experience |
| :---: | :---: |
| ![Dashboard Light Mode](docs/screenshots/02_dashboard_light.png) | ![Dashboard Dark Mode](docs/screenshots/03_dashboard_dark.png) |
| *Clean Google Pay layout with wallet cards and quick payee list* | *Eye-friendly dark theme with high-contrast emerald and blue status badges* |

| Clean Authentication Screen | User Profile & Security Menu |
| :---: | :---: |
| ![Sign In Screen](docs/screenshots/01_login_auth.png) | ![User Profile Menu](docs/screenshots/11_user_profile_menu.png) |
| *Explicit input placeholders with eye toggle for password privacy* | *Direct access to Linked Bank Accounts, PIN Configuration, and sign-out* |

---

### Showcase 2: Multi-Bank Account Management & Vector Emblems
Users can manage multi-bank accounts, check balances, set primary routing accounts, and link accounts through a simulated NPCI UPI account aggregator. All logos use **100% handcrafted SVG vector geometry** under nominative fair-use principles, avoiding copyrighted raster images.

| Linked Bank Accounts View | Instant Account Linking & Transfer Form |
| :---: | :---: |
| ![Linked Bank Accounts](docs/screenshots/05_linked_bank_accounts.png) | ![UPI Wallet Transfer View](docs/screenshots/04_upi_wallet_transfer.png) |
| *Vector emblems for HDFC, SBI, ICICI, etc. with primary status markers* | *Multi-bank payment source dropdown and instant recipient resolution* |

---

### Showcase 3: Real-Time Fraud Interception & Explainable AI (XAI)
Every transaction is inspected in-line by the hybrid risk engine. If anomalous activity is detected, transactions are blocked or flagged in real time, and compliance officers can view a comprehensive **Explainable AI (XAI)** decomposition.

| Explainable AI (XAI) Risk Breakdown | Dynamic UPI Receive QR Generator |
| :---: | :---: |
| ![XAI Risk Breakdown](docs/screenshots/10_xai_risk_breakdown.png) | ![Receive Money QR Modal](docs/screenshots/06_receive_money_qr.png) |
| *Decomposition of composite risk score, heuristic guardrails, and ML probabilities* | *Interactive 256-bit QR code generator with 1-tap scan simulation* |

---

### Showcase 4: Compliance Operations Hub & Audit Queue
Compliance officers and risk analysts have a dedicated real-time control room to inspect incoming alerts, analyze model trigger factors, and manually approve or uphold transaction blocks.

![Compliance Operations Hub](docs/screenshots/09_compliance_hub.png)
*Real-time compliance monitoring queue with live Socket.IO anomaly streaming and officer investigation controls.*

---

### Showcase 5: Transaction Audit & Multi-Format Statement Exports
A comprehensive ledger records all wallet deposits, peer-to-peer transfers, and withdrawals. Users and auditors can filter transactions by status or date and generate formal PDF statements and Excel spreadsheets.

![Transaction History Table](docs/screenshots/07_transaction_history.png)
*Full transaction history with search filters, real-time risk scores, and 1-click statement export.*

![AI Telemetry Dashboard](docs/screenshots/08_ai_telemetry_analytics.png)
*Live AI Telemetry showing learned feature weights (Logistic Regression coefficients) and decision distributions.*

---

## 🏗️ System Architecture

FinGuard separates high-performance UI components, in-line fraud risk evaluation, and background asynchronous notifications:

```
┌────────────────────────────────────────────────────────────────────────┐
│                       CLIENT TIER (React 19 + Vite)                    │
│   Dashboard • Wallet & Transfer • Analytics Telemetry • Compliance Hub │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP (Axios) + WebSockets (Socket.IO)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      GATEWAY & MIDDLEWARE TIER                         │
│       JWT Auth Middleware • CORS Safe Origin • Body Validation (Zod)   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│      HYBRID FRAUD RISK ENGINE     │ │       LEDGER & BANKING APIS      │
│  - Deterministic Rule Guardrails  │ │  - Wallet Transactions (ACID)    │
│  - Native ML Inference (<0.1ms)   │ │  - Multi-Bank NPCI Aggregator    │
│  - Explainable AI Trigger Factors │ │  - 6-Digit PIN Security Layer    │
└────────────────┬──────────────────┘ └──────────────────┬───────────────┘
                 │                                       │
                 ▼                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE & EVENT TIER                          │
│   PostgreSQL (Prisma ORM) • Resilient In-Memory/Redis Caching          │
│   Socket.IO Broadcast Rooms ('user:id' & 'fraud:monitoring')           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Machine Learning Pipeline & Benchmarks

### 1. Vectorized Dataset Generator (`generate_dataset.py`)
* Implemented with **NumPy array vectorization**, producing 100,000 synthetic transaction records across realistic user personas in **~0.44 seconds** (~40x faster than traditional loops).
* Incorporates **hard negatives** (e.g., legitimate high-value tuition payments draining 80%+ balance) and **stealth fraud** (micro carder test charges) to prevent trivial separability.

### 2. Model Training & Evaluation Metrics (`train_model.py`)
Trained on an 80/20 stratified split with balanced class weights:

| Metric | Primary Model (Logistic Regression) | Decision Tree Baseline | Random Forest Baseline |
| :--- | :---: | :---: | :---: |
| **Accuracy** | **88.58%** | 96.73% | 95.84% |
| **Precision** | **60.41%** | 85.91% | 88.22% |
| **Recall (Fraud)** | **83.99%** | 88.22% | 91.70% |
| **ROC-AUC** | **0.9218** | 0.9847 | 0.9847 |
| **Inference Latency** | **< 0.1 ms (Native Node.js)** | ~2.5 ms | ~8.0 ms |
| **Model Size** | **1.4 KB (Zero dependencies)** | 45 KB | 1.8 MB |

> **Rationale for Logistic Regression:** While tree-based ensembles offer slightly higher recall, Logistic Regression provides **deterministic mathematical explainability**, **sub-millisecond execution in native JavaScript**, and a **1.4 KB portable JSON parameter payload**, ideal for high-throughput payment gateways.

---

## 💻 Local Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.x or v20+
- **PostgreSQL**: Local instance running on port 5432
- **Python**: v3.10+ (only required if retraining models)

### Step 1: Clone Repository
```bash
git clone https://github.com/ramanrishi076/FinGuard.git
cd FinGuard
```

### Step 2: Configure Environment Variables
Create `server/.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finguard_db?schema=public"
JWT_SECRET="finguard_super_secure_jwt_secret_key_2026"
REFRESH_TOKEN_EXPIRES_DAYS=7
```

### Step 3: Install Dependencies & Run Database Migrations
```bash
# Server setup
cd server
npm install
npx prisma db push
node src/scripts/seedSampleAccount.js

# Client setup
cd ../client
npm install
```

### Step 4: Launch Dev Servers
Open two terminal windows:

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

### Step 5: Test Credentials
- **Demo User:** `demo@finguard.com` / `password123`
- **Transaction PIN:** `112233`
- **Peer User (for transfers):** `alice@finguard.com` / `password123`

---

## 🔒 Security & Architectural Highlights

1. **BigInt Precision:** Currency amounts are stored and manipulated as 64-bit integer units to eliminate IEEE 754 floating-point rounding errors.
2. **Transaction PIN Cryptography:** Transaction PINs are salted and hashed using **bcrypt** (cost factor 10) and verified in-line before funds leave any account.
3. **Idempotency & Concurrency:** Peer-to-peer wallet transfers run in an isolated Prisma `$transaction` block to guarantee atomicity.
4. **Resilient Offline Cache:** Includes transparent in-memory cache fallbacks when Redis is offline, maintaining continuous operational uptime.

---

## 📜 License & Authorship
This project is original intellectual property created and built by **Rishi**.
Licensed under the FinGuard Software License & Attribution Rights — see the [LICENSE](LICENSE) file for strict authorship protection and non-misrepresentation terms.
