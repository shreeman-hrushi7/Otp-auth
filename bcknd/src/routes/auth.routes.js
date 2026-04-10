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

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: true }, (err, user, info) => {
    if (err) {
      console.error("Google OAuth error:", err.message);
      return res.redirect(
        `${CLIENT_URL}/auth/callback?error=GOOGLE_AUTH_FAILED`,
      );
    }

    if (!user) {
      const message = info?.message || "GOOGLE_AUTH_FAILED";
      return res.redirect(`${CLIENT_URL}/auth/callback?error=${message}`);
    }

    const token = signToken(user._id);

    const params = new URLSearchParams({
      token,
      name: user.name || "",
      email: user.email || "",
      avatar: user.avatar || "",
      organization: user.organization || "",
      registrationStep: user.registrationStep || "onboarded",
    });

    res.redirect(`${CLIENT_URL}/auth/callback?${params.toString()}`);
  })(req, res, next);
});

module.exports = router;
