const rateLimit = require("express-rate-limit");

const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message: { status: "fail", message },
    standardHeaders: true,
    legacyHeaders: false,
  });

// Strict limiter for OTP send endpoints (prevents OTP flooding)
const otpLimiter = createLimiter(
  15,
  5,
  "Too many OTP requests. Please wait 15 minutes before trying again.",
);

// General auth limiter for login/register

const authLimiter = createLimiter(
  15,
  20,
  "Too many requests from this IP. Please try again after 15 minutes.",
);

module.exports = { otpLimiter, authLimiter };
