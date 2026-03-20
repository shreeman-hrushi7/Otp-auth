const express = require("express");
const router = express.Router();
// importing the controllers by destructuring the exports from auth.controller.js
const {
  registerInit,      // send OTP for signup
  registerVerifyOTP,  // verify OTP for signup
  registerSetPassword, // save password after OTP verification
  loginWithPassword,  // login using email + password
  loginOTPInit,   // send OTP for login
  loginOTPVerify,  // verify otp for login 
} = require("../controllers/auth.controller");


// importing the validators for each route i.e user ka input sahi hai ya nhi
const {
  validateRegisterInit,
  validateVerifyOTP,
  validateSetPassword,
  validateLoginPassword,
  validateLoginOTPInit,
  validateLoginOTPVerify,
} = require("../validators/auth.validators");

// handle errors from validators eg if email is invalid -> send errror response

const handleValidationErrors = require("../middlewares/validate");

// otplimiter -> stopping otp spam , authLimiter -> stopping brute force attack on login and otp verification routes
const { otpLimiter, authLimiter } = require("../middlewares/rateLimiter");


// ── Registration flow ──────────────────────────────────────────────────────
// Step 1 — submit email, receive OTP
router.post(
  "/register/init",
  otpLimiter,  // middleware 
  validateRegisterInit, // validator
  handleValidationErrors, // middleware 
  registerInit, // controller
);
// Step 2 — verify OTP
router.post(
  "/register/verify-otp",
  authLimiter,  // middleware
  validateVerifyOTP, // validator
  handleValidationErrors, // middleware
  registerVerifyOTP, // controller
);

// Step 3 — set password (email must already be verified)
router.post(
  "/register/set-password",
  authLimiter,
  validateSetPassword,
  handleValidationErrors,
  registerSetPassword,
);

// ── Login flow ─────────────────────────────────────────────────────────────
// Option A — email + password
router.post(
  "/login/password",
  authLimiter,
  validateLoginPassword,
  handleValidationErrors,
  loginWithPassword,
);

// Option B — OTP login: step 1 send OTP
router.post(
  "/login/otp/init",
  otpLimiter,
  validateLoginOTPInit,
  handleValidationErrors,
  loginOTPInit,
);

// Option B — OTP login: step 2 verify OTP
router.post(
  "/login/otp/verify",
  authLimiter,
  validateLoginOTPVerify,
  handleValidationErrors,
  loginOTPVerify,
);

module.exports = router;
