/**
 * FinGuard Machine Learning Prediction Service
 * Phase 5: Zero-dependency, native Node.js inference engine
 * 
 * Uses pre-trained standardized Logistic Regression weights exported from
 * train_model.py. Guarantees fast, native execution without external Python
 * runtime dependencies, suitable for standalone Electron desktop distribution.
 */

const fs = require("fs");
const path = require("path");

class MLPredictor {
  constructor(modelPath) {
    this.modelPath =
      modelPath || path.join(__dirname, "models", "model.json");
    this.model = null;
    this.loadModel();
  }

  loadModel() {
    try {
      if (fs.existsSync(this.modelPath)) {
        const raw = fs.readFileSync(this.modelPath, "utf-8");
        this.model = JSON.parse(raw);
      } else {
        console.warn(`[MLPredictor] Model file not found at ${this.modelPath}. Using default weights.`);
        this.model = this.getDefaultModel();
      }
    } catch (err) {
      console.error("[MLPredictor] Error loading model:", err);
      this.model = this.getDefaultModel();
    }
  }

  getDefaultModel() {
    return {
      model_name: "FinGuard Fallback Logistic Regression",
      model_type: "LogisticRegression",
      version: "1.0.0-fallback",
      features: [
        "amount",
        "balance_before",
        "balance_after",
        "recent_transaction_count",
        "amount_to_balance_ratio",
        "is_night_time",
      ],
      scaler: {
        mean: [9418.4, 50081.4, 40663.2, 0.602, 0.198, 0.170],
        scale: [15222.6, 66530.6, 59979.7, 1.271, 0.254, 0.375],
      },
      intercept: -6.521556,
      coefficients: [1.02949, 0.274033, 0.042695, 5.519727, 3.095219, 0.675004],
      decision_threshold: 0.5,
    };
  }

  isReady() {
    return Boolean(this.model && this.model.coefficients && this.model.scaler);
  }

  getModelMetadata() {
    if (!this.model) return null;
    return {
      modelName: this.model.model_name,
      modelType: this.model.model_type,
      version: this.model.version,
      threshold: this.model.decision_threshold,
      features: this.model.features,
      metrics: this.model.evaluation_metrics,
    };
  }

  /**
   * Predicts fraud probability and risk score for a transaction.
   *
   * @param {Object} params
   * @param {number|string|bigint} params.amount
   * @param {number|string|bigint} [params.balanceBefore]
   * @param {number|string|bigint} [params.balanceAfter]
   * @param {number|string|bigint} [params.balanceAfterTransaction]
   * @param {number} [params.recentTransactionCount=0]
   * @param {number} [params.hourOfDay]
   * @param {boolean} [params.isNightTime]
   * @returns {Object}
   */
  predict({
    amount,
    balanceBefore,
    balanceAfter,
    balanceAfterTransaction,
    recentTransactionCount = 0,
    hourOfDay,
    isNightTime,
  }) {
    if (!this.isReady()) {
      this.loadModel();
    }

    const amountNum = Math.max(0, Number(amount || 0));
    const balanceAfterNum = Math.max(
      0,
      Number(
        balanceAfter !== undefined
          ? balanceAfter
          : balanceAfterTransaction !== undefined
          ? balanceAfterTransaction
          : 0
      )
    );

    const balanceBeforeNum =
      balanceBefore !== undefined
        ? Math.max(0, Number(balanceBefore))
        : balanceAfterNum + amountNum;

    const recentCountNum = Math.max(0, Number(recentTransactionCount || 0));

    const ratio =
      balanceBeforeNum > 0
        ? Math.min(1.0, amountNum / balanceBeforeNum)
        : amountNum > 0
        ? 1.0
        : 0.0;

    let nightTimeVal = 0;
    if (isNightTime !== undefined) {
      nightTimeVal = isNightTime ? 1 : 0;
    } else if (hourOfDay !== undefined) {
      nightTimeVal = hourOfDay >= 0 && hourOfDay < 6 ? 1 : 0;
    } else {
      const currentHour = new Date().getHours();
      nightTimeVal = currentHour >= 0 && currentHour < 6 ? 1 : 0;
    }

    const rawFeatures = [
      amountNum,
      balanceBeforeNum,
      balanceAfterNum,
      recentCountNum,
      ratio,
      nightTimeVal,
    ];

    const { mean, scale } = this.model.scaler;
    const coefficients = this.model.coefficients;
    const intercept = this.model.intercept;

    // Standardize features and compute logit
    let logit = intercept;
    const normalizedFeatures = [];
    const featureContributions = [];

    for (let i = 0; i < rawFeatures.length; i++) {
      const normalized = (rawFeatures[i] - mean[i]) / (scale[i] || 1.0);
      normalizedFeatures.push(normalized);
      const contribution = coefficients[i] * normalized;
      featureContributions.push(contribution);
      logit += contribution;
    }

    // Sigmoid probability: 1 / (1 + exp(-logit))
    const probability = 1 / (1 + Math.exp(-logit));

    // Calculate ML risk score (0 - 100)
    // Low probabilities (< 0.15) calibrate smoothly to zero risk
    let mlRiskScore = 0;
    if (probability > 0.15) {
      mlRiskScore = Math.min(
        100,
        Math.round(((probability - 0.15) / (1.0 - 0.15)) * 100)
      );
    }

    const threshold = this.model.decision_threshold || 0.5;
    const isFraud = probability >= threshold;

    // Identify human-readable risk factors
    const factors = [];
    if (recentCountNum >= 3) {
      factors.push("ML: High transaction velocity detected");
    }
    if (ratio >= 0.75) {
      factors.push("ML: Extreme balance drain ratio");
    }
    if (amountNum >= 50000) {
      factors.push("ML: Large amount statistical anomaly");
    }
    if (balanceAfterNum < 100 && ratio > 0.6) {
      factors.push("ML: Depletion of remaining wallet balance");
    }
    if (nightTimeVal === 1 && probability >= threshold) {
      factors.push("ML: Off-hours high-risk pattern");
    }
    if (isFraud && factors.length === 0) {
      factors.push("ML: Multi-feature statistical anomaly pattern");
    }

    return {
      probability: Number(probability.toFixed(4)),
      mlRiskScore,
      isFraud,
      decision: isFraud ? "FLAGGED_BY_ML" : "CLEARED_BY_ML",
      factors,
      features: {
        amount: amountNum,
        balanceBefore: balanceBeforeNum,
        balanceAfter: balanceAfterNum,
        recentTransactionCount: recentCountNum,
        amountToBalanceRatio: Number(ratio.toFixed(4)),
        isNightTime: nightTimeVal,
      },
    };
  }
}

// Singleton export
const mlPredictor = new MLPredictor();

module.exports = {
  MLPredictor,
  mlPredictor,
};
