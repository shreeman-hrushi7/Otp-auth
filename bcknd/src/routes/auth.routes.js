const express = require("express");
const router = express.Router();
const passport = require("passport");

const {
  registerInit,
  registerVerifyOTP,
  registerSetPassword,
  loginWithPassword,
  loginOTPInit,
  loginOTPVerify,
} = require("../controllers/auth.controller");

const {
  validateRegisterInit,
  validateVerifyOTP,
  validateSetPassword,
  validateLoginPassword,
  validateLoginOTPInit,
  validateLoginOTPVerify,
} = require("../validators/auth.validators");

const handleValidationErrors = require("../middlewares/validate");
const { otpLimiter, authLimiter } = require("../middlewares/rateLimiter");
const { signToken } = require("../services/token.service");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ── Registration ───────────────────────────────────────────────────────────
router.post(
  "/register/init",
  otpLimiter,
  validateRegisterInit,
  handleValidationErrors,
  registerInit,
);
router.post(
  "/register/verify-otp",
  authLimiter,
  validateVerifyOTP,
  handleValidationErrors,
  registerVerifyOTP,
);
router.post(
  "/register/set-password",
  authLimiter,
  validateSetPassword,
  handleValidationErrors,
  registerSetPassword,
);

// ── Login ──────────────────────────────────────────────────────────────────
router.post(
  "/login/password",
  authLimiter,
  validateLoginPassword,
  handleValidationErrors,
  loginWithPassword,
);
router.post(
  "/login/otp/init",
  otpLimiter,
  validateLoginOTPInit,
  handleValidationErrors,
  loginOTPInit,
);
router.post(
  "/login/otp/verify",
  authLimiter,
  validateLoginOTPVerify,
  handleValidationErrors,
  loginOTPVerify,
);

// ── Google OAuth ───────────────────────────────────────────────────────────
// Step 1 — redirect to Google consent screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

// Step 2 — Google redirects back here with an authorization code
// We use a CUSTOM CALLBACK so we can handle both success and failure ourselves.
// This avoids the invalid_grant issue caused by passport middleware mis-handling.
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: true }, (err, user, info) => {
    // ── Hard error (network issue, bad credentials, etc.) ──────────────────
    if (err) {
      console.error("Google OAuth error:", err.message);
      return res.redirect(
        `${CLIENT_URL}/auth/callback?error=GOOGLE_AUTH_FAILED`,
      );
    }

    // ── Soft failure — user denied or EMAIL_EXISTS_LOCAL ───────────────────
    if (!user) {
      const message = info?.message || "GOOGLE_AUTH_FAILED";
      return res.redirect(`${CLIENT_URL}/auth/callback?error=${message}`);
    }

    // ── Success — issue JWT and redirect to frontend ───────────────────────
    const token = signToken(user._id);
    const params = new URLSearchParams({
      token,
      name: user.name || "",
      email: user.email || "",
      organization: user.organization || "",
      registrationStep: user.registrationStep || "onboarded",
    });

    res.redirect(`${CLIENT_URL}/auth/callback?${params.toString()}`);
  })(req, res, next);
});

module.exports = router;
