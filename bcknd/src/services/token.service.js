const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

/**
 * Signs a JWT containing the user's id.
 * @param {string} userId - MongoDB ObjectId as string
 * @returns {string} signed JWT
 */
const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws AppError(401) if invalid or expired.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Your session has expired. Please log in again.", 401);
    }
    throw new AppError("Invalid token. Please log in again.", 401);
  }
};

module.exports = { signToken, verifyToken };
