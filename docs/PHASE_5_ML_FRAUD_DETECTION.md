# FinGuard Phase 5: Machine Learning Fraud Detection

## 1. Overview
In Phase 5 of the FinGuard project roadmap, we built and deployed a reproducible Machine Learning (ML) fraud detection layer that seamlessly integrates with the existing rule-based engine.

FinGuard is a desktop-only secure digital wallet simulation targeted for distribution as `FinGuard-Setup.exe` via Electron (Phases 8 & 10). To satisfy desktop packaging requirements, the ML prediction engine is implemented in **native Node.js** utilizing standardized weights exported from a reproducible Python scikit-learn training pipeline. This eliminates external Python runtime dependencies for end-users while ensuring fast, zero-latency inference.

---

## 2. Dataset Design (Synthetic & Reproducible)
> **Label Notice**: The dataset is entirely **synthetic** and designed specifically for FinGuard's financial wallet simulation.

- **Generation Script**: `server/src/ml/generate_dataset.py`
- **Output Path**: `server/src/ml/data/synthetic_fraud_dataset.csv`
- **Seed**: Fixed at `42` for 100% reproducibility.
- **Dataset Size**: 6,000 transactions
  - **Legitimate (Class 0)**: 5,100 samples (85.0%)
  - **Fraudulent (Class 1)**: 900 samples (15.0%)

### Feature Dictionary
| Feature | Type | Description |
|---|---|---|
| `amount` | Float | Transaction transfer amount |
| `balance_before` | Float | Sender wallet balance prior to transfer |
| `balance_after` | Float | Sender wallet balance remaining after transfer |
| `recent_transaction_count`| Integer | Number of transactions initiated in the last 10 minutes |
| `amount_to_balance_ratio` | Float | `amount / max(balance_before, 1.0)` |
| `is_night_time` | Integer | Binary flag: `1` if hour in [00:00–05:59], else `0` |
| `is_fraud` | Integer | Ground truth label (`0` = legitimate, `1` = fraudulent) |

### Fraud Scenarios Simulated
1. **Account Draining / Takeover**: High proportion transfer (`ratio > 0.88`) leaving negligible remaining balance (`< 100`).
2. **High-Velocity Smurfing**: Rapid burst of transfers (`recent_transaction_count >= 3`).
3. **Anomalous Spikes**: Unusually large transfer amounts (`>= 50,000`) straining account reserves.
4. **Off-Hours Drain**: High balance drain occurring during late night hours (`00:00–05:59`).

---

## 3. Model Architecture & Selection
- **Training Pipeline**: `server/src/ml/train_model.py`
- **Train/Test Split**: 80% Train (4,800 samples) / 20% Test (1,200 samples), stratified by class label.
- **Model Selected**: **Logistic Regression with Standard Scaling** (`StandardScaler` + `LogisticRegression(class_weight='balanced', random_state=42)`).

### Why Logistic Regression?
1. **Zero External Runtime Dependency**: Parameters (`mean`, `scale`, `coefficients`, `intercept`) are exported to `model.json`. Node.js evaluates sigmoid probabilities via lightweight vector multiplication in `< 0.1ms`.
2. **Auditability & Explainability**: Linear coefficients provide human-readable attribution for why a transaction was flagged.
3. **Desktop Packaging Feasibility**: Essential for the future `FinGuard-Setup.exe` build.

### Learned Feature Coefficients
| Feature | Coefficient | Interpretation |
|---|---|---|
| `recent_transaction_count` | `+5.519727` | High velocity indicates automated bot/smurfing attacks |
| `amount_to_balance_ratio` | `+3.095219` | Draining a high fraction of balance indicates account takeover |
| `amount` | `+1.029490` | High transfer value carries elevated statistical baseline risk |
| `is_night_time` | `+0.675004` | Off-hours activity moderately elevates risk score |
| `balance_before` | `+0.274033` | Relative scale indicator |
| `balance_after` | `+0.042695` | Residual balance indicator |
| **Intercept** | `-6.521556` | Strongly negative bias for ordinary everyday transfers |

---

## 4. Honest Model Evaluation
Evaluation performed strictly on the held-out 20% test partition (1,200 samples: 1,020 legitimate, 180 fraudulent):

| Metric | Primary Model (Logistic Regression) | Baseline (Decision Tree) | Baseline (Random Forest) |
|---|---|---|---|
| **Accuracy** | **0.9992** | 1.0000 | 1.0000 |
| **Precision** | **0.9945** | 1.0000 | 1.0000 |
| **Recall** | **1.0000** | 1.0000 | 1.0000 |
| **F1-Score** | **0.9972** | 1.0000 | 1.0000 |
| **ROC-AUC** | **1.0000** | 1.0000 | 1.0000 |

### Confusion Matrix (Test Set)
- **True Positives (TP)**: 180 (All fraud instances detected)
- **True Negatives (TN)**: 1,019
- **False Positives (FP)**: 1 (Minimal friction for legitimate transactions)
- **False Negatives (FN)**: 0 (Zero fraud slips through)

---

## 5. Integration Architecture

### Prediction Service (`server/src/ml/mlPredictor.js`)
- Reads parameters from `models/model.json`.
- Safely scales raw inputs, executes logit calculation, applies sigmoid activation, and produces calibrated risk scores (0–100) and readable factor reasons.

### Hybrid Fusion Engine (`server/src/services/fraudEngine.js`)
The fraud engine combines deterministic business rules with probabilistic ML scoring:

```javascript
// Preserve deterministic heuristic rules
let compositeScore = Math.max(
  ruleScore,
  Math.round(0.4 * ruleScore + 0.6 * mlResult.mlRiskScore)
);

// High-confidence ML escalations
if (mlResult.probability >= 0.85) {
  compositeScore = Math.max(compositeScore, 80); // BLOCKED
} else if (mlResult.isFraud) {
  compositeScore = Math.max(compositeScore, 60); // FLAGGED
}
```

### Risk Bands
- **80–100**: `BLOCKED` (Transaction rejected, HTTP 403)
- **60–79**: `FLAGGED` (Transaction recorded as FLAGGED for investigation)
- **30–59**: `REVIEW` (Transaction marked for secondary review)
- **0–29**: `APPROVED` (Clean transaction execution)

---

## 6. Verification and Test Results
Ran `node src/services/testFraudEngine.js`:

1. **Test 1 — Normal Transaction** ($500 transfer, $4,500 balance remaining, 0 recent count):
   - `riskScore`: 0 | `decision`: **APPROVED** | `ruleScore`: 0 | `mlScore`: 0
2. **Test 2 — Large Transaction** ($60,000 transfer, $40,000 balance remaining, 0 recent count):
   - `riskScore`: 30 | `decision`: **REVIEW** | `ruleScore`: 30 | `reasons`: `['Large transaction amount', 'ML: Large amount statistical anomaly']`
3. **Test 3 — Suspicious Transaction** ($60,000 transfer, 5 recent transactions, $50 remaining):
   - `riskScore`: 94 | `decision`: **BLOCKED** | `ruleScore`: 85 | `mlScore`: 100
4. **Test 4 — ML Account Draining Anomaly** ($9,800 transfer from $10,000 at 3 AM):
   - `riskScore`: 80 | `decision`: **BLOCKED** | `ruleScore`: 0 | `mlScore`: 100
5. **Test 5 — Off-Hours High Velocity Smurfing** (4 recent transactions at 2 AM):
   - `riskScore`: 80 | `decision`: **BLOCKED** | `ruleScore`: 25 | `mlScore`: 100

---

## 7. Limitations & Future Roadmap
1. **Synthetic Data**: The training dataset is synthetic; production deployment would benefit from continuous feedback loops and re-training on labeled historical user telemetry.
2. **Cold-Start Users**: For new accounts with no prior history, the model relies on global thresholds until personal behavior baselines are formed.
3. **Phase 6 Alignment**: Fraud decisions and real-time alerts will be broadcasted to the desktop UI via Redis and Socket.IO.
