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