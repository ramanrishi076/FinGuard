/**
 * FinGuard Redis & In-Memory Resilient Cache & Pub/Sub
 * Phase 6: Redis + Real-Time Systems
 *
 * Provides a high-performance Redis client with seamless, transparent
 * fallback to an in-memory store if Redis is offline or not configured.
 * This ensures zero-friction desktop distribution (FinGuard-Setup.exe)
 * while leveraging real Redis when available in production/cloud.
 */

const EventEmitter = require("events");
let Redis;
try {
  Redis = require("ioredis");
} catch {
  Redis = null;
}

class InMemoryStore {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
    this.emitter = new EventEmitter();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.del(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value: String(value), expiresAt });

    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }

    if (ttlSeconds) {
      const timer = setTimeout(() => {
        this.del(key);
      }, ttlSeconds * 1000);
      if (timer.unref) timer.unref();
      this.timeouts.set(key, timer);
    }
    return "OK";
  }

  del(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    const existed = this.cache.delete(key);
    return existed ? 1 : 0;
  }

  incr(key) {
    const current = Number(this.get(key) || 0) + 1;
    this.set(key, String(current));
    return current;
  }

  publish(channel, message) {
    this.emitter.emit(channel, message);
    return 1;
  }

  subscribe(channel, handler) {
    this.emitter.on(channel, handler);
  }

  unsubscribe(channel, handler) {
    this.emitter.off(channel, handler);
  }

  flushall() {
    for (const timer of this.timeouts.values()) {
      clearTimeout(timer);
    }
    this.timeouts.clear();
    this.cache.clear();
    return "OK";
  }
}

class RedisManager {
  constructor() {
    this.inMemory = new InMemoryStore();
    this.isRedisAvailable = false;
    this.redisClient = null;
    this.redisSubClient = null;
    this.subscribers = new Map();

    this.init();
  }

  init() {
    const redisUrl = process.env.REDIS_URL;

    if (!Redis) {
      console.log("[Redis] ioredis package not found. Using resilient in-memory store.");
      return;
    }

    // If REDIS_URL is provided, or default localhost is enabled
    const options = {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 2) {
          // Cease retrying to avoid log spam if Redis is not installed locally
          return null;
        }
        return 500;
      },
      connectTimeout: 1500,
    };

    try {
      const connectionTarget = redisUrl || "redis://127.0.0.1:6379";
      this.redisClient = new Redis(connectionTarget, options);
      this.redisSubClient = new Redis(connectionTarget, options);

      this.redisClient.on("connect", () => {
        this.isRedisAvailable = true;
        console.log("[Redis] Connected to Redis server successfully.");
      });

      this.redisClient.on("error", (err) => {
        if (this.isRedisAvailable) {
          console.warn("[Redis] Redis connection lost, switching to in-memory fallback:", err.message);
        }
        this.isRedisAvailable = false;
      });

      this.redisSubClient.on("error", () => {
        this.isRedisAvailable = false;
      });

      // Attempt gentle connection
      this.redisClient.connect().catch(() => {
        this.isRedisAvailable = false;
        console.log("[Redis] No local Redis server reachable. Active fallback: Resilient In-Memory Mode.");
      });

      this.redisSubClient.connect().catch(() => {
        this.isRedisAvailable = false;
      });
    } catch {
      this.isRedisAvailable = false;
      console.log("[Redis] Fallback to in-memory cache and pub/sub active.");
    }
  }

  getStatus() {
    return {
      status: this.isRedisAvailable ? "CONNECTED" : "FALLBACK_IN_MEMORY",
      driver: this.isRedisAvailable ? "ioredis" : "in-memory-adapter",
    };
  }

  // --- Cache Operations ---
  async get(key) {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.get(key);
      } catch {
        return this.inMemory.get(key);
      }
    }
    return this.inMemory.get(key);
  }

  async set(key, value, ttlSeconds) {
    const valStr = typeof value === "object" ? JSON.stringify(value) : String(value);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        if (ttlSeconds) {
          return await this.redisClient.set(key, valStr, "EX", ttlSeconds);
        }
        return await this.redisClient.set(key, valStr);
      } catch {
        return this.inMemory.set(key, valStr, ttlSeconds);
      }
    }
    return this.inMemory.set(key, valStr, ttlSeconds);
  }

  async del(key) {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.del(key);
      } catch {
        return this.inMemory.del(key);
      }
    }
    return this.inMemory.del(key);
  }

  async incr(key) {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        return await this.redisClient.incr(key);
      } catch {
        return this.inMemory.incr(key);
      }
    }
    return this.inMemory.incr(key);
  }

  // --- Pub/Sub Operations ---
  async publish(channel, data) {
    const payload = typeof data === "object" ? JSON.stringify(data) : String(data);

    // Always dispatch locally so local listeners receive it immediately
    this.inMemory.publish(channel, payload);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.publish(channel, payload);
      } catch (err) {
        console.warn(`[Redis] Publish to ${channel} failed, dispatched in-memory:`, err.message);
      }
    }
  }

  subscribe(channel, callback) {
    // Register in-memory handler
    const wrapper = (payload) => {
      try {
        const parsed = JSON.parse(payload);
        callback(parsed);
      } catch {
        callback(payload);
      }
    };

    this.inMemory.subscribe(channel, wrapper);

    if (this.isRedisAvailable && this.redisSubClient) {
      this.redisSubClient.subscribe(channel).catch(() => {});
      this.redisSubClient.on("message", (chan, msg) => {
        if (chan === channel) {
          // Avoid duplicate calls since inMemory also triggers
        }
      });
    }

    return () => {
      this.inMemory.unsubscribe(channel, wrapper);
    };
  }
}

const redisManager = new RedisManager();

module.exports = redisManager;
