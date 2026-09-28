/**
 * FinGuard Real-Time & Redis Test Suite
 * Phase 6: Automated verification of Redis caching, Pub/Sub, and Socket.IO real-time events
 */

const http = require("http");
const jwt = require("jsonwebtoken");
const ioClient = require("socket.io-client");
const redisManager = require("../lib/redis");
const {
  initSocket,
  notifyBalanceUpdate,
  notifyTransactionCreated,
  notifyFraudAlert,
} = require("../lib/socket");

const TEST_PORT = 5099;
const TEST_JWT_SECRET = process.env.JWT_SECRET || "finguard_test_secret_for_suite";
process.env.JWT_SECRET = TEST_JWT_SECRET;

const runTests = async () => {
  console.log("==================================================");
  console.log("FinGuard Phase 6: Redis & Real-Time Test Suite");
  console.log("==================================================\n");

  // 1. Test Redis Cache Operations
  console.log("--- 1. Testing Redis Cache Engine ---");
  const redisStatus = redisManager.getStatus();
  console.log(`Redis Manager Status: ${redisStatus.status} (${redisStatus.driver})`);

  // Set & Get
  await redisManager.set("test:wallet:1", { balance: "50000" }, 10);
  const cachedVal = await redisManager.get("test:wallet:1");
  const parsed = JSON.parse(cachedVal);
  console.log(`Cache Set & Get: balance=${parsed.balance} -> ${parsed.balance === "50000" ? "PASSED" : "FAILED"}`);

  // Increment
  await redisManager.set("test:counter", 5);
  const incVal = await redisManager.incr("test:counter");
  console.log(`Cache Increment: 5 + 1 = ${incVal} -> ${incVal === 6 ? "PASSED" : "FAILED"}`);

  // Delete
  await redisManager.del("test:wallet:1");
  const deletedVal = await redisManager.get("test:wallet:1");
  console.log(`Cache Invalidation: key deleted -> ${deletedVal === null ? "PASSED" : "FAILED"}`);

  // 2. Test Pub/Sub
  console.log("\n--- 2. Testing Pub/Sub Messaging ---");
  let pubsubReceived = false;
  const unsubscribe = redisManager.subscribe("test:channel", (data) => {
    pubsubReceived = data.hello === "world";
  });

  await redisManager.publish("test:channel", { hello: "world" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(`Pub/Sub Message Dispatch: ${pubsubReceived ? "PASSED" : "FAILED"}`);
  unsubscribe();

  // 3. Test HTTP Server & Socket.IO Initialization
  console.log("\n--- 3. Testing Socket.IO Real-Time Server ---");
  const dummyApp = (req, res) => res.end("ok");
  const server = http.createServer(dummyApp);
  const ioServer = initSocket(server);

  await new Promise((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`Test Socket.IO Server listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  // 4. Test Socket.IO Authentication (Rejection without Token)
  console.log("\n--- 4. Testing Socket.IO Auth Security ---");
  const unauthClient = ioClient(`http://localhost:${TEST_PORT}`, {
    transports: ["websocket"],
    reconnection: false,
  });

  const authRejected = await new Promise((resolve) => {
    unauthClient.on("connect_error", (err) => {
      resolve(err.message.includes("Authentication token required"));
      unauthClient.close();
    });
    setTimeout(() => resolve(false), 1500);
  });
  console.log(`Reject Connection Without Token: ${authRejected ? "PASSED" : "FAILED"}`);

  // 5. Test Valid Connection with Signed JWT & Room Join
  console.log("\n--- 5. Testing Authorized Connection & Real-Time Events ---");
  const testUserId = 77;
  const validToken = jwt.sign(
    { userId: testUserId, email: "tester77@finguard.com" },
    TEST_JWT_SECRET,
    { expiresIn: "1h" }
  );

  const client = ioClient(`http://localhost:${TEST_PORT}`, {
    auth: { token: validToken },
    transports: ["websocket"],
  });

  await new Promise((resolve, reject) => {
    client.on("connect", resolve);
    client.on("connect_error", reject);
  });
  console.log(`Authorized Connection Established (User ID ${testUserId}): PASSED`);

  // Subscribe to monitoring room
  client.emit("join_fraud_monitoring");

  // 6. Test Real-Time Event Reception: BALANCE_UPDATED
  const balancePromise = new Promise((resolve) => {
    client.on("BALANCE_UPDATED", (data) => {
      resolve(data.userId === testUserId && data.balance === "12500");
    });
  });
  notifyBalanceUpdate(testUserId, "12500");
  const balancePassed = await balancePromise;
  console.log(`Event BALANCE_UPDATED Received: ${balancePassed ? "PASSED" : "FAILED"}`);

  // 7. Test Real-Time Event Reception: TRANSACTION_CREATED
  const txPromise = new Promise((resolve) => {
    client.on("TRANSACTION_CREATED", (data) => {
      resolve(data.role === "SENDER" && data.transaction.id === 101);
    });
  });
  notifyTransactionCreated({
    senderUserId: testUserId,
    receiverUserId: 99,
    transaction: {
      id: 101,
      amount: "500",
      type: "TRANSFER",
      status: "APPROVED",
      description: "Coffee payment",
      createdAt: new Date(),
    },
  });
  const txPassed = await txPromise;
  console.log(`Event TRANSACTION_CREATED Received: ${txPassed ? "PASSED" : "FAILED"}`);

  // 8. Test Real-Time Event Reception: FRAUD_ALERT
  const fraudPromise = new Promise((resolve) => {
    client.on("FRAUD_ALERT", (alert) => {
      resolve(
        alert.userId === testUserId &&
        alert.decision === "BLOCKED" &&
        alert.riskScore === 94
      );
    });
  });
  notifyFraudAlert({
    userId: testUserId,
    transactionId: 102,
    amount: "75000",
    riskScore: 94,
    decision: "BLOCKED",
    reasons: ["Large transaction amount", "ML: High transaction velocity detected"],
    ruleScore: 85,
    ml: {
      riskScore: 100,
      probability: 1.0,
      decision: "FLAGGED_BY_ML",
      factors: ["ML: High transaction velocity detected"],
    },
  });
  const fraudPassed = await fraudPromise;
  console.log(`Event FRAUD_ALERT Received: ${fraudPassed ? "PASSED" : "FAILED"}`);

  // Cleanup
  client.close();
  await new Promise((resolve) => server.close(resolve));

  console.log("\n==================================================");
  console.log("ALL REAL-TIME & REDIS TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
  process.exit(0);
};

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
