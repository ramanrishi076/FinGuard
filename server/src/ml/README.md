# FinGuard Machine Learning Module

This directory contains the machine learning fraud detection pipeline for FinGuard.

## Structure
- `data/`
  - `synthetic_fraud_dataset.csv`: 100,000 (1 lakh) reproducible synthetic transaction records generated with seed=42.
- `models/`
  - `model.json`: Trained Logistic Regression weights, scaler parameters, decision threshold, and metadata.
  - `evaluation_report.json`: Comprehensive test metrics, confusion matrix, and comparative baseline benchmarks.
- `generate_dataset.py`: Python generator for the reproducible synthetic fraud dataset.
- `train_model.py`: Python training script (train/test split, scaling, training, evaluation, parameter export).
- `mlPredictor.js`: Native Node.js inference engine that evaluates transactions using the exported weights without external Python dependencies.

## Usage

### Re-generate Dataset
Vectorized NumPy generator with realistic overlap, hard negatives, and extended behavioral signals:
```bash
# Default (100,000 samples, 15% fraud, CSV format)
python generate_dataset.py

# Custom configuration with CLI flags
python generate_dataset.py --samples 250000 --fraud-ratio 0.10 --noise-ratio 0.02 --users 10000 --format csv
```

### Re-train Model
```bash
python train_model.py
```

### Test Native Node.js Predictor
```bash
node -e "const { mlPredictor } = require('./mlPredictor'); console.log(mlPredictor.predict({ amount: 500, balanceBefore: 5000, balanceAfter: 4500 }));"
```

### Test Integrated Hybrid Engine
```bash
node src/services/testFraudEngine.js
```
