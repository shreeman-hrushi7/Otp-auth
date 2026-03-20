const mongoose = require("mongoose");
// otp expiry time in min
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 15;

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
  },
  // 'register' – used during first-time sign-up OTP flow
  // 'login'    – used for OTP-based login
  purpose: {
    type: String,
    enum: ["register", "login"],
    required: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  },
});

// MongoDB automatically removes documents when expiresAt is reached
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Replace any existing OTP for the same email+purpose before inserting
otpSchema.statics.upsertOTP = async function (email, code, purpose) {
  await this.deleteMany({ email, purpose });
  return this.create({ email, code, purpose });
};

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
