const Redis = require("ioredis");

let redis = null;
let isRedisReady = false;

try {
  redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      // Stop retrying after 3 attempts — Redis is optional
      if (times >= 3) return null;
      return Math.min(times * 500, 2000);
    },
  });

  redis.on("ready", () => {
    isRedisReady = true;
    console.log("Redis connected");
  });

  redis.on("error", () => {
    isRedisReady = false;
    // Silently swallow — we log once below, not on every retry
  });

  redis.on("close", () => {
    isRedisReady = false;
  });

  // Connect in background — never block app startup
  redis.connect().catch(() => {
    console.warn("Redis not available — rate limiting will be skipped");
  });
} catch (err) {
  console.warn("Redis setup failed — rate limiting will be skipped");
}

/**
 * Returns true only when Redis is connected and usable.
 * Use this before every Redis operation to avoid 500 errors.
 */
const isReady = () => isRedisReady && redis !== null;

module.exports = { redis, isReady };
