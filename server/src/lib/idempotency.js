const redisManager = require("./redis");

/**
 * Bank-Grade Idempotency Service
 * Prevents double-spend, duplicate charges, or replay attacks.
 */
const getIdempotencyKey = (userId, clientKey) => {
  return `idempotency:${userId}:${clientKey}`;
};

const checkIdempotency = async (clientKey, userId) => {
  if (!clientKey) return { isDuplicate: false };

  const key = getIdempotencyKey(userId, clientKey);
  const existing = await redisManager.get(key);

  if (existing) {
    if (existing === "IN_PROGRESS") {
      return { inProgress: true };
    }
    try {
      const parsed = JSON.parse(existing);
      return { isDuplicate: true, response: parsed };
    } catch {
      return { isDuplicate: true, response: existing };
    }
  }

  // Mark as IN_PROGRESS for 30 seconds
  await redisManager.set(key, "IN_PROGRESS", 30);
  return { isDuplicate: false };
};

const saveIdempotency = async (clientKey, userId, responseData, ttlSeconds = 300) => {
  if (!clientKey) return;
  const key = getIdempotencyKey(userId, clientKey);
  await redisManager.set(key, JSON.stringify(responseData), ttlSeconds);
};

const clearIdempotency = async (clientKey, userId) => {
  if (!clientKey) return;
  const key = getIdempotencyKey(userId, clientKey);
  await redisManager.del(key);
};

module.exports = {
  checkIdempotency,
  saveIdempotency,
  clearIdempotency,
};
