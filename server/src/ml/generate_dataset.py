"""
FinGuard Machine Learning Fraud Detection - Synthetic Dataset Generator
Phase 5: Reproducible Dataset Generation

NOTE: This dataset contains SYNTHETIC transaction records designed specifically
for training and evaluating the FinGuard machine-learning fraud detection model.
Random seed is fixed (42) to guarantee full reproducibility.
"""

import os
import random
import numpy as np
import pandas as pd

def generate_synthetic_fraud_dataset(
    output_path="data/synthetic_fraud_dataset.csv",
    n_samples=6000,
    fraud_ratio=0.15,
    random_seed=42,
):
    np.random.seed(random_seed)
    random.seed(random_seed)

    n_fraud = int(n_samples * fraud_ratio)
    n_legit = n_samples - n_fraud

    records = []

    # 1. Legitimate transactions (Class 0)
    for _ in range(n_legit):
        pattern = np.random.choice(["routine", "high_balance_transfer", "low_night_transfer"], p=[0.75, 0.20, 0.05])

        if pattern == "routine":
            # Everyday normal transfers
            balance_before = np.random.uniform(2000, 40000)
            max_amount = balance_before * np.random.uniform(0.02, 0.45)
            amount = np.random.uniform(15, min(max_amount, 8000))
            balance_after = max(balance_before - amount, 100)
            # Low velocity
            recent_count = np.random.choice([0, 1, 2], p=[0.85, 0.12, 0.03])
            is_night = np.random.choice([0, 1], p=[0.92, 0.08])

        elif pattern == "high_balance_transfer":
            # High-balance legitimate transfer
            balance_before = np.random.uniform(60000, 300000)
            amount = np.random.uniform(5000, min(balance_before * 0.35, 45000))
            balance_after = balance_before - amount
            recent_count = np.random.choice([0, 1], p=[0.90, 0.10])
            is_night = 0  # Business hours

        else:
            # Low value late-night transfer
            balance_before = np.random.uniform(1000, 15000)
            amount = np.random.uniform(10, min(balance_before * 0.15, 500))
            balance_after = balance_before - amount
            recent_count = 0
            is_night = 1

        ratio = amount / max(balance_before, 1.0)

        records.append({
            "amount": round(float(amount), 2),
            "balance_before": round(float(balance_before), 2),
            "balance_after": round(float(balance_after), 2),
            "recent_transaction_count": int(recent_count),
            "amount_to_balance_ratio": round(float(ratio), 4),
            "is_night_time": int(is_night),
            "is_fraud": 0,
        })

    # 2. Fraudulent transactions (Class 1)
    for _ in range(n_fraud):
        pattern = np.random.choice(
            ["account_drain", "high_velocity_smurfing", "large_anomalous_spike", "night_anomaly"],
            p=[0.35, 0.30, 0.20, 0.15],
        )

        if pattern == "account_drain":
            # Drain victim account completely
            balance_before = np.random.uniform(1500, 60000)
            drain_ratio = np.random.uniform(0.88, 0.999)
            amount = balance_before * drain_ratio
            balance_after = max(balance_before - amount, np.random.uniform(0, 80))
            recent_count = np.random.choice([1, 2, 3, 4], p=[0.25, 0.35, 0.25, 0.15])
            is_night = np.random.choice([0, 1], p=[0.55, 0.45])

        elif pattern == "high_velocity_smurfing":
            # Rapid micro/medium transactions to bypass static flags
            balance_before = np.random.uniform(10000, 80000)
            amount = np.random.uniform(800, 12000)
            balance_after = max(balance_before - amount, 50)
            recent_count = np.random.randint(3, 8)
            is_night = np.random.choice([0, 1], p=[0.60, 0.40])

        elif pattern == "large_anomalous_spike":
            # Large unexpected transfer pushing wallet to limit
            balance_before = np.random.uniform(50000, 120000)
            amount = np.random.uniform(50000, min(balance_before * 0.98, 95000))
            balance_after = max(balance_before - amount, 10)
            recent_count = np.random.choice([1, 2, 4, 5], p=[0.30, 0.30, 0.20, 0.20])
            is_night = np.random.choice([0, 1], p=[0.65, 0.35])

        else:
            # Night anomaly with high ratio
            balance_before = np.random.uniform(5000, 40000)
            amount = balance_before * np.random.uniform(0.65, 0.92)
            balance_after = balance_before - amount
            recent_count = np.random.choice([2, 3, 4], p=[0.40, 0.40, 0.20])
            is_night = 1

        ratio = amount / max(balance_before, 1.0)

        records.append({
            "amount": round(float(amount), 2),
            "balance_before": round(float(balance_before), 2),
            "balance_after": round(float(balance_after), 2),
            "recent_transaction_count": int(recent_count),
            "amount_to_balance_ratio": round(float(ratio), 4),
            "is_night_time": int(is_night),
            "is_fraud": 1,
        })

    # Shuffle dataset
    df = pd.DataFrame(records)
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    print(f"Dataset generated successfully at: {output_path}")
    print(f"Total samples: {len(df)}")
    print(f"Legitimate samples (Class 0): {sum(df['is_fraud'] == 0)} ({sum(df['is_fraud'] == 0)/len(df)*100:.1f}%)")
    print(f"Fraudulent samples (Class 1): {sum(df['is_fraud'] == 1)} ({sum(df['is_fraud'] == 1)/len(df)*100:.1f}%)")
    print("\nFeature Summary:")
    print(df.describe().to_string())

    return df

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    target_csv = os.path.join(current_dir, "data", "synthetic_fraud_dataset.csv")
    generate_synthetic_fraud_dataset(output_path=target_csv)
