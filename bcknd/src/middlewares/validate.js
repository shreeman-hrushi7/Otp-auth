const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

/**
 * Reads any errors left by express-validator and throws a 422 AppError.
 * Place this AFTER the validator chain in the route definition.
 */
const handleValidationErrors = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new AppError(messages.join(" | "), 422));
  }
  next();
};

module.exports = handleValidationErrors;
