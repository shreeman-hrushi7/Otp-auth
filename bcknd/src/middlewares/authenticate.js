const User = require("../models/User.model");
const { verifyToken } = require("../services/token.service");
const asyncWrapper = require("../utils/asyncWrapper"); // wraps async functions to catch errors and pass to next()
const AppError = require("../utils/AppError"); // Custom error class for consistent error handling across the app

/**
 * Protects routes by verifying the Bearer JWT in the Authorization header.
 * Attaches the full user document to req.user on success.
 */
const authenticate = asyncWrapper(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError(
        "You are not logged in. Please log in to access this resource.",
        401,
      ),
    );
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token); // throws AppError on failure

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError(
        "The account belonging to this token no longer exists.",
        401,
      ),
    );
  }

  req.user = user;
  next();
});

module.exports = authenticate;
