const express = require("express");
const router = express.Router();

const { completeOnboarding } = require("../controllers/onboarding.controller");
const { validateOnboarding } = require("../validators/auth.validators");
const handleValidationErrors = require("../middlewares/validate");
const authenticate = require("../middlewares/authenticate");

// PATCH /api/onboarding
// Protected — requires a valid JWT (issued after set-password step)
router.patch(
  "/",
  authenticate,
  validateOnboarding,
  handleValidationErrors,
  completeOnboarding,
);

module.exports = router;
