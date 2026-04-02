const { redis, isReady } = require("../config/redis");
const AppError = require("../utils/AppError");
const asyncWrapper = require("../utils/asyncWrapper");

/**
 * Redis rate limiter — keyed by email (OTP endpoints) or IP (auth endpoints).
 * If Redis is unavailable the middleware simply calls next() and lets the
 * request through — the app never returns a 500 because of Redis being down.
 */
const createRedisLimiter = ({ windowMinutes, max, keyType, message }) => {
  const windowSeconds = windowMinutes * 60;

  return asyncWrapper(async (req, res, next) => {
    // Skip entirely if Redis is not connected
    if (!isReady()) {
      return next();
    }

    try {
      let identifier;

      if (keyType === "email") {
        identifier = req.body?.email?.toLowerCase()?.trim();
        // No email in body yet — let the validator handle it
        if (!identifier) return next();
      } else {
        identifier =
          req.ip ||
          req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
          "unknown";
      }

      const key = `rl:${keyType}:${identifier}`;

      // INCR is atomic — safe under concurrent requests
      const count = await redis.incr(key);

      // Set TTL only on the first request so the window starts then
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));

      if (count > max) {
        const ttl = await redis.ttl(key);
        res.setHeader("Retry-After", ttl > 0 ? ttl : windowSeconds);
        return next(new AppError(message, 429));
      }

      next();
    } catch (err) {
      // Any Redis error — fail open, don't crash the request
      console.error("Rate limiter error:", err.message);
      next();
    }
  });
};

// OTP endpoints — keyed by email, max 5 per 15 min
const otpLimiter = createRedisLimiter({
  windowMinutes: 15,
  max: 5,
  keyType: "email",
  message: "Too many OTP requests for this email. Please wait 15 minutes.",
});

// General auth endpoints — keyed by IP, max 20 per 15 min
const authLimiter = createRedisLimiter({
  windowMinutes: 15,
  max: 20,
  keyType: "ip",
  message: "Too many requests from this IP. Please try again after 15 minutes.",
});

module.exports = { otpLimiter, authLimiter };
