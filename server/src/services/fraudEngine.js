const { mlPredictor } = require("../ml/mlPredictor");

/**
 * Hybrid Fraud Detection Engine
 * Integrates deterministic heuristic business rules with a trained
 * Machine Learning (Logistic Regression) probabilistic risk model.
 *
 * @param {Object} params
 * @param {number|string|bigint} params.amount
 * @param {number} [params.recentTransactionCount=0]
 * @param {number|string|bigint} [params.balanceAfterTransaction=0]
 * @param {number|string|bigint} [params.balanceBefore]
 * @param {number} [params.hourOfDay]
 * @param {boolean} [params.isNightTime]
 * @returns {Object} { riskScore, decision, reasons, ruleScore, ml }
 */
const calculateFraudRisk = ({
  amount,
  recentTransactionCount = 0,
  balanceAfterTransaction = 0,
  balanceBefore,
  hourOfDay,
  isNightTime,
}) => {
  let ruleScore = 0;
  const reasons = [];

  const transactionAmount = BigInt(amount);
  const remainingBalance = BigInt(balanceAfterTransaction);

  // Rule 1: Large transaction
  if (transactionAmount >= 50000n) {
    ruleScore += 30;
    reasons.push("Large transaction amount");
  }

  // Rule 2: Rapid/repeated transactions
  if (recentTransactionCount >= 3) {
    ruleScore += 25;
    reasons.push("Multiple recent transactions");
  }

  // Rule 3: Transaction leaves unusually low balance
  if (remainingBalance < 100n) {
    ruleScore += 15;
    reasons.push("Transaction leaves very low balance");
  }

  // Rule 4: High transaction frequency
  if (recentTransactionCount >= 5) {
    ruleScore += 15;
    reasons.push("High transaction frequency");
  }

  // Keep rule score within 0–100
  ruleScore = Math.min(ruleScore, 100);

  // Invoke Machine Learning Prediction Service
  const mlResult = mlPredictor.predict({
    amount: transactionAmount.toString(),
    balanceAfter: remainingBalance.toString(),
    balanceBefore: balanceBefore ? balanceBefore.toString() : undefined,
    recentTransactionCount,
    hourOfDay,
    isNightTime,
  });

  // Hybrid Risk Fusion:
  // 1. Maintain rule determinism: Heuristic rule breaches cannot be reduced by ML.
  // 2. Incorporate ML risk score: Multi-variable anomaly detection escalates risk.
  let compositeScore = Math.max(
    ruleScore,
    Math.round(0.4 * ruleScore + 0.6 * mlResult.mlRiskScore)
  );

  // If ML detects high probability anomaly, enforce appropriate risk boundaries
  if (mlResult.probability >= 0.85) {
    compositeScore = Math.max(compositeScore, 80);
  } else if (mlResult.isFraud) {
    compositeScore = Math.max(compositeScore, 60);
  }

  compositeScore = Math.min(compositeScore, 100);

  // Combine heuristic reasons and ML risk factor explanations
  const combinedReasons = [...reasons];
  for (const factor of mlResult.factors) {
    if (!combinedReasons.includes(factor)) {
      combinedReasons.push(factor);
    }
  }

  let decision;
  if (compositeScore >= 80) {
    decision = "BLOCKED";
  } else if (compositeScore >= 60) {
    decision = "FLAGGED";
  } else if (compositeScore >= 30) {
    decision = "REVIEW";
  } else {
    decision = "APPROVED";
  }

  return {
    riskScore: compositeScore,
    decision,
    reasons: combinedReasons,
    ruleScore,
    ml: {
      riskScore: mlResult.mlRiskScore,
      probability: mlResult.probability,
      decision: mlResult.decision,
      factors: mlResult.factors,
    },
  };
};

module.exports = {
  calculateFraudRisk,
};