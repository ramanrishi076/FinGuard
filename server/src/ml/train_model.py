"""
FinGuard Machine Learning Fraud Detection - Model Training & Honest Evaluation
Phase 5: Train and Evaluate Lightweight Model

This script:
1. Loads the reproducible synthetic fraud dataset.
2. Performs an 80/20 stratified train/test split.
3. Fits StandardScaler and LogisticRegression (with balanced class weights).
4. Trains baseline models (Decision Tree & Random Forest) for comparison.
5. Computes honest evaluation metrics (Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix).
6. Exports model parameters to JSON for zero-dependency native Node.js inference.
"""

import json
import os
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

def train_and_evaluate(
    data_path="data/synthetic_fraud_dataset.csv",
    output_model_path="models/model.json",
    output_report_path="models/evaluation_report.json",
    random_state=42,
):
    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    feature_cols = [
        "amount",
        "balance_before",
        "balance_after",
        "recent_transaction_count",
        "amount_to_balance_ratio",
        "is_night_time",
    ]
    target_col = "is_fraud"

    X = df[feature_cols]
    y = df[target_col]

    # Stratified Train/Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_state, stratify=y
    )

    print(f"Train samples: {len(X_train)} (Legit: {sum(y_train == 0)}, Fraud: {sum(y_train == 1)})")
    print(f"Test samples:  {len(X_test)} (Legit: {sum(y_test == 0)}, Fraud: {sum(y_test == 1)})")

    # Fit Scaler on training data only
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Primary Model: Logistic Regression (balanced weights, highly interpretable, lightweight)
    lr_model = LogisticRegression(
        class_weight="balanced",
        random_state=random_state,
        max_iter=1000,
        C=1.0,
    )
    lr_model.fit(X_train_scaled, y_train)

    lr_pred = lr_model.predict(X_test_scaled)
    lr_proba = lr_model.predict_proba(X_test_scaled)[:, 1]

    tn, fp, fn, tp = confusion_matrix(y_test, lr_pred).ravel()
    lr_metrics = {
        "accuracy": round(float(accuracy_score(y_test, lr_pred)), 4),
        "precision": round(float(precision_score(y_test, lr_pred)), 4),
        "recall": round(float(recall_score(y_test, lr_pred)), 4),
        "f1_score": round(float(f1_score(y_test, lr_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, lr_proba)), 4),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
        },
    }

    # 2. Baseline Model 1: Decision Tree
    dt_model = DecisionTreeClassifier(max_depth=5, random_state=random_state, class_weight="balanced")
    dt_model.fit(X_train, y_train)
    dt_pred = dt_model.predict(X_test)
    dt_proba = dt_model.predict_proba(X_test)[:, 1]
    dt_tn, dt_fp, dt_fn, dt_tp = confusion_matrix(y_test, dt_pred).ravel()
    dt_metrics = {
        "accuracy": round(float(accuracy_score(y_test, dt_pred)), 4),
        "precision": round(float(precision_score(y_test, dt_pred)), 4),
        "recall": round(float(recall_score(y_test, dt_pred)), 4),
        "f1_score": round(float(f1_score(y_test, dt_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, dt_proba)), 4),
        "confusion_matrix": {
            "true_negatives": int(dt_tn),
            "false_positives": int(dt_fp),
            "false_negatives": int(dt_fn),
            "true_positives": int(dt_tp),
        },
    }

    # 3. Baseline Model 2: Random Forest
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=random_state, class_weight="balanced")
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_proba = rf_model.predict_proba(X_test)[:, 1]
    rf_tn, rf_fp, rf_fn, rf_tp = confusion_matrix(y_test, rf_pred).ravel()
    rf_metrics = {
        "accuracy": round(float(accuracy_score(y_test, rf_pred)), 4),
        "precision": round(float(precision_score(y_test, rf_pred)), 4),
        "recall": round(float(recall_score(y_test, rf_pred)), 4),
        "f1_score": round(float(f1_score(y_test, rf_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, rf_proba)), 4),
        "confusion_matrix": {
            "true_negatives": int(rf_tn),
            "false_positives": int(rf_fp),
            "false_negatives": int(rf_fn),
            "true_positives": int(rf_tp),
        },
    }

    print("\n--- Logistic Regression (Primary Model) Evaluation ---")
    print(f"Accuracy:  {lr_metrics['accuracy']:.4f}")
    print(f"Precision: {lr_metrics['precision']:.4f}")
    print(f"Recall:    {lr_metrics['recall']:.4f}")
    print(f"F1-Score:  {lr_metrics['f1_score']:.4f}")
    print(f"ROC-AUC:   {lr_metrics['roc_auc']:.4f}")
    print(f"Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")
    print("\nClassification Report:")
    print(classification_report(y_test, lr_pred, target_names=["Legitimate (0)", "Fraud (1)"]))

    print("\n--- Model Comparison ---")
    print(f"Logistic Regression: Accuracy={lr_metrics['accuracy']}, Recall={lr_metrics['recall']}, F1={lr_metrics['f1_score']}, ROC-AUC={lr_metrics['roc_auc']}")
    print(f"Decision Tree:       Accuracy={dt_metrics['accuracy']}, Recall={dt_metrics['recall']}, F1={dt_metrics['f1_score']}, ROC-AUC={dt_metrics['roc_auc']}")
    print(f"Random Forest:       Accuracy={rf_metrics['accuracy']}, Recall={rf_metrics['recall']}, F1={rf_metrics['f1_score']}, ROC-AUC={rf_metrics['roc_auc']}")

    # Export Model artifact for native zero-dependency Node.js deployment
    feature_coefficients = {
        col: round(float(coef), 6)
        for col, coef in zip(feature_cols, lr_model.coef_[0])
    }

    model_artifact = {
        "model_name": "FinGuard Logistic Regression Fraud Detector",
        "model_type": "LogisticRegression",
        "version": "1.0.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_synthetic_training": True,
        "features": feature_cols,
        "scaler": {
            "mean": [round(float(m), 6) for m in scaler.mean_],
            "scale": [round(float(s), 6) for s in scaler.scale_],
        },
        "intercept": round(float(lr_model.intercept_[0]), 6),
        "coefficients": [round(float(c), 6) for c in lr_model.coef_[0]],
        "feature_coefficients": feature_coefficients,
        "decision_threshold": 0.50,
        "evaluation_metrics": lr_metrics,
    }

    os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
    with open(output_model_path, "w", encoding="utf-8") as f:
        json.dump(model_artifact, f, indent=2)

    # Detailed Evaluation Report
    evaluation_report = {
        "model_name": "FinGuard ML Fraud Detection Suite",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_summary": {
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "fraud_ratio": round(float(sum(y == 1) / len(y)), 4),
            "data_source": "reproducible synthetic dataset (seed=42)",
        },
        "primary_model": {
            "type": "StandardScaler + LogisticRegression(class_weight='balanced')",
            "decision_threshold": 0.50,
            "metrics": lr_metrics,
            "coefficients": feature_coefficients,
            "intercept": round(float(lr_model.intercept_[0]), 6),
        },
        "baseline_comparisons": {
            "decision_tree": dt_metrics,
            "random_forest": rf_metrics,
        },
        "interpretation": {
            "highest_risk_positive_features": sorted(
                feature_coefficients.items(), key=lambda x: x[1], reverse=True
            ),
            "rationale": "Logistic regression provides fully explainable risk factors, zero runtime latency, and standalone portability required for the Electron desktop installer."
        }
    }

    with open(output_report_path, "w", encoding="utf-8") as f:
        json.dump(evaluation_report, f, indent=2)

    print(f"\nModel exported to: {output_model_path}")
    print(f"Evaluation report exported to: {output_report_path}")

    return model_artifact

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_csv = os.path.join(current_dir, "data", "synthetic_fraud_dataset.csv")
    model_json = os.path.join(current_dir, "models", "model.json")
    report_json = os.path.join(current_dir, "models", "evaluation_report.json")
    train_and_evaluate(data_path=data_csv, output_model_path=model_json, output_report_path=report_json)
