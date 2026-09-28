# FinGuard Phase 7: React Desktop UI

## 1. Overview
In Phase 7 of the FinGuard roadmap, we designed and built the complete, state-of-the-art **React Desktop User Interface**. 

Designed for high visual impact and financial clarity, the UI features a curated dark-mode fintech aesthetic, glassmorphism, responsive navigation, and real-time live telemetry integration via Socket.IO. The application is built to serve as the user interface rendered inside Electron in Phase 8 for standalone Windows distribution (`FinGuard-Setup.exe`).

---

## 2. Technology Stack & Design System
- **Framework**: React.js 19 with Vite 8.
- **Styling**: Tailwind CSS v4 with custom tokens in [`index.css`](file:///c:/Users/raman/FinGuard/client/src/index.css).
- **Typography**: Google Fonts (*Plus Jakarta Sans* for UI, *JetBrains Mono* for currency and transaction hashes).
- **Charts & Visualizations**: Recharts.
- **Icons**: Lucide React.
- **Communications**: Axios (HTTP client with JWT refresh interceptors) and `socket.io-client` (real-time live event streaming).

---

## 3. UI Views & Architecture

### 1. Authentication View (`src/views/AuthView.jsx`)
- Dual-mode card interface supporting **Sign In** and **Registration**.
- Automatic access and refresh token storage in `localStorage`.
- Highlight showcase detailing FinGuard's 100,000 transaction ML training, 99.98% accuracy, and sub-millisecond fraud scoring.
- One-click sample credential autofill for rapid testing.

### 2. Dashboard Overview (`src/views/DashboardView.jsx`)
- **Primary Wallet Balance Hero Card**: Big bold currency display in ₹ (INR), unique wallet reference number, 24h deposit/outflow tracking, and instant action triggers.
- **AI Fraud Shield Health Radar**: Displays machine-learning model status, 100k training scale, 100% recall metric, and real-time Socket.IO connection status.
- **Live Transaction Activity Feed**: Real-time incoming transactions update immediately without page reloads.
- **Security Alerts Panel**: Direct feed of transactions requiring review, flagged, or blocked.

### 3. Wallet & Action Center (`src/views/WalletView.jsx`)
- **Virtual Digital Metallic FinGuard Card**: Interactive virtual card featuring chip, contactless icon, cardholder name, wallet ID (`FG-WLT-00000X`), and live balance.
- **Inline Quick Transfer Form**: Allows users to transfer funds to any recipient User ID with live balance limit checks and AI risk radar previews.
- **Quick Action Bar**: Fast triggers for deposits, withdrawals, and transfers.

### 4. Transaction History Audit (`src/views/TransactionsView.jsx`)
- **Multi-Filter Controls**:
  - Filter by transaction type: `ALL`, `DEPOSIT`, `TRANSFER`, `WITHDRAWAL`.
  - Filter by fraud status: `ALL`, `APPROVED`, `REVIEW`, `FLAGGED`, `BLOCKED`.
  - Instant text search by Transaction ID, description, or amount.
- **Audit Table**: Shows timestamp, type, direction, description/memo, fraud evaluation status badge, and precise monetary values.
- **Inspection**: Click any row to open the detailed transaction modal.

### 5. Fraud Engine Analytics & Telemetry (`src/views/AnalyticsView.jsx`)
- **Model Metric Cards**: 100k sample scale, 99.98% test accuracy, 100% fraud recall, and < 0.1ms native Node.js inference speed.
- **Horizontal Bar Chart (ML Feature Weights)**:
  - Visualizes the 6 trained Logistic Regression weights from Phase 5:
    - Recent Velocity (`+12.958`)
    - Balance Drain Ratio (`+5.841`)
    - Outlier Transfer Amount (`+2.112`)
    - Prior Wallet Balance (`+1.044`)
    - Remaining Wallet Balance (`+0.633`)
    - Off-Hours Activity (`+0.538`)
- **Donut Chart (Decision Breakdown)**: Visual distribution of platform transactions categorized into Approved, Review, Flagged, and Blocked.
- **Live Real-Time Event Stream**: Live telemetric event log listening to Socket.IO events (`BALANCE_UPDATED`, `TRANSACTION_CREATED`, `FRAUD_ALERT`).

---

## 4. Interactive Modals & Real-Time Alerts
1. **`DepositModal.jsx`**:
   - Quick preset buttons (₹500, ₹1k, ₹5k, ₹10k, ₹25k) and custom input with instant wallet balance synchronization.
2. **`WithdrawModal.jsx`**:
   - Allows safe withdrawals with "Use Max Balance" shortcut and strict balance limits.
3. **`TransferModal.jsx`**:
   - Features **AI Shield Pre-Evaluation Warnings** (alerts users when amount ≥ ₹50,000 or when balance drain ≥ 85%).
   - If blocked (HTTP 403), captures error payload and displays an explainable security card explaining the risk score, decision, and detected rules.
4. **`TransactionDetailModal.jsx`**:
   - In-depth modal inspecting transaction timestamp, sender/receiver wallet IDs, description, and fraud status.
5. **`FraudAlertToast.jsx`**:
   - Persistent pop-up banner on the bottom-right triggered immediately whenever a real-time `FRAUD_ALERT` is broadcasted over WebSockets.

---

## 5. Build Verification
- Executed `npm run build` with Vite 8 + `@tailwindcss/vite`:
  - 2,555 modules transformed.
  - Zero errors, zero warnings.
  - Production bundle generated cleanly in `759ms`.

---

## 6. Next Roadmap Milestone
- **Phase 8 — Electron Desktop Integration**:
  - Integrate Electron to wrap the React UI and background Node.js server into a native Windows desktop application that launches automatically without terminal commands.
