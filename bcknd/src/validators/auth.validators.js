const { body } = require("express-validator");

// ── Re-usable field rules ───────────────────────────────────────────────────
const emailField = body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required.")
  .isEmail()
  .withMessage("Please provide a valid email address.")
  .normalizeEmail();

const otpField = body("otp")
  .trim()
  .notEmpty()
  .withMessage("OTP is required.")
  .isLength({ min: 6, max: 6 })
  .withMessage("OTP must be exactly 6 digits.")
  .isNumeric()
  .withMessage("OTP must contain only digits.");

const passwordField = body("password")
  .notEmpty()
  .withMessage("Password is required.")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters.")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter.")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter.")
  .matches(/\d/)
  .withMessage("Password must contain at least one number.");

const nameField = body("name")
  .trim()
  .notEmpty()
  .withMessage("Name is required.")
  .isLength({ min: 2, max: 80 })
  .withMessage("Name must be between 2 and 80 characters.");

const organizationField = body("organization")
  .trim()
  .notEmpty()
  .withMessage("Organisation is required.")
  .isLength({ min: 2, max: 120 })
  .withMessage("Organisation name must be between 2 and 120 characters.");

// ── Exported validator chains ───────────────────────────────────────────────
module.exports = {
  validateRegisterInit: [emailField],
  validateVerifyOTP: [emailField, otpField],
  validateSetPassword: [emailField, passwordField],
  validateLoginPassword: [emailField, passwordField],
  validateLoginOTPInit: [emailField],
  validateLoginOTPVerify: [emailField, otpField],
  validateOnboarding: [nameField, organizationField],
};
