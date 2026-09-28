const { calculateFraudRisk } = require("./fraudEngine");

console.log("Test 1 — Normal transaction");

console.log(
  calculateFraudRisk({
    amount: "500",
    recentTransactionCount: 0,
    balanceAfterTransaction: "4500",
  })
);

console.log("\nTest 2 — Large transaction");

console.log(
  calculateFraudRisk({
    amount: "60000",
    recentTransactionCount: 0,
    balanceAfterTransaction: "40000",
  })
);

console.log("\nTest 3 — Suspicious transaction");

console.log(
  calculateFraudRisk({
    amount: "60000",
    recentTransactionCount: 5,
    balanceAfterTransaction: "50",
  })
);

console.log("\nTest 4 — ML Account Draining Anomaly");

console.log(
  calculateFraudRisk({
    amount: "9800",
    balanceBefore: "10000",
    balanceAfterTransaction: "200",
    recentTransactionCount: 2,
    hourOfDay: 3,
  })
);

console.log("\nTest 5 — Off-Hours High Velocity Smurfing");

console.log(
  calculateFraudRisk({
    amount: "4500",
    balanceBefore: "25000",
    balanceAfterTransaction: "20500",
    recentTransactionCount: 4,
    hourOfDay: 2,
  })
);