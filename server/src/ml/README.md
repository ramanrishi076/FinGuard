# FinGuard Machine Learning Module

This directory contains the machine learning fraud detection pipeline for FinGuard.

## Structure
- `data/`
  - `synthetic_fraud_dataset.csv`: 6,000 reproducible synthetic transaction records generated with seed=42.
- `models/`
  - `model.json`: Trained Logistic Regression weights, scaler parameters, decision threshold, and metadata.
  - `evaluation_report.json`: Comprehensive test metrics, confusion matrix, and comparative baseline benchmarks.
- `generate_dataset.py`: Python generator for the reproducible synthetic fraud dataset.
- `train_model.py`: Python training script (train/test split, scaling, training, evaluation, parameter export).
- `mlPredictor.js`: Native Node.js inference engine that evaluates transactions using the exported weights without external Python dependencies.

## Usage

### Re-generate Dataset
```bash
python generate_dataset.py
```

### Re-train Model
```bash
python train_model.py
```

### Test Native Node.js Predictor
```bash
node -e "const { mlPredictor } = require('./mlPredictor'); console.log(mlPredictor.predict({ amount: 500, balanceBefore: 5000, balanceAfter: 4500 }));"
```
