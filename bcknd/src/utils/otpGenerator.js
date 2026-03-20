const crypto = require("crypto");

/**
 * Generates a cryptographically secure N-digit numeric OTP.
 * Defaults to 6 digits.
 */
const generateOTP = (digits = 6) => {
  const max = 10 ** digits;
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  // Ensure the result is always exactly `digits` long (zero-padded)
  return String(randomNumber % max).padStart(digits, "0");
};

module.exports = generateOTP;
