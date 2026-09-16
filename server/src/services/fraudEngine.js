const calculateFraudRisk = ({
  amount,
  recentTransactionCount = 0,
  balanceAfterTransaction = 0,
}) => {
  let riskScore = 0;
  const reasons = [];

  const transactionAmount = BigInt(amount);
  const remainingBalance = BigInt(balanceAfterTransaction);

  // Rule 1: Large transaction
  if (transactionAmount >= 50000n) {
    riskScore += 30;
    reasons.push("Large transaction amount");
  }

  // Rule 2: Rapid/repeated transactions
  if (recentTransactionCount >= 3) {
    riskScore += 25;
    reasons.push("Multiple recent transactions");
  }

  // Rule 3: Transaction leaves unusually low balance
  if (remainingBalance < 100n) {
    riskScore += 15;
    reasons.push("Transaction leaves very low balance");
  }

  // Rule 4: High transaction frequency
  if (recentTransactionCount >= 5) {
    riskScore += 15;
    reasons.push("High transaction frequency");
  }

  // Keep score within 0–100
  riskScore = Math.min(riskScore, 100);

  let decision;

  if (riskScore >= 80) {
    decision = "BLOCKED";
  } else if (riskScore >= 60) {
    decision = "FLAGGED";
  } else if (riskScore >= 30) {
    decision = "REVIEW";
  } else {
    decision = "APPROVED";
  }

  return {
    riskScore,
    decision,
    reasons,
  };
};

module.exports = {
  calculateFraudRisk,
};