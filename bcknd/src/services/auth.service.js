const User = require("../models/User.model");
const OTP = require("../models/OTP.model");
const generateOTP = require("../utils/otpGenerator");
const { sendOTPEmail } = require("./email.service");
const { signToken } = require("./token.service");
const AppError = require("../utils/AppError");

// ── Step 1: Registration – submit email, send OTP ──────────────────────────
const initiateRegistration = async (email) => {
  // If user already fully registered, block re-registration
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.isVerified) {
    throw new AppError(
      "An account with this email already exists. Please log in.",
      409,
    );
  }

  // Create or reuse a pending user record
  if (!existingUser) {
    await User.create({ email });
  } else {
    // Reset registration if they abandoned mid-flow
    existingUser.registrationStep = "pending";
    existingUser.isVerified = false;
    await existingUser.save();
  }

  const otp = generateOTP(6);
  await OTP.upsertOTP(email, otp, "register");
  await sendOTPEmail(email, otp, "register");
};

// ── Step 2: Registration – verify OTP ──────────────────────────────────────
const verifyRegistrationOTP = async (email, code) => {
  const otpRecord = await OTP.findOne({ email, purpose: "register" });

  if (!otpRecord) {
    throw new AppError(
      "OTP not found or has expired. Please request a new one.",
      400,
    );
  }
  if (otpRecord.code !== code) {
    throw new AppError("Invalid OTP. Please try again.", 400);
  }

  await OTP.deleteMany({ email, purpose: "register" });

  // Return a short-lived "verified" flag so the client can proceed to set password
  // We mark isVerified=true here; password is set in the next step
  const user = await User.findOneAndUpdate(
    { email },
    { isVerified: true },
    { new: true },
  );
  if (!user) throw new AppError("User not found.", 404);

  return user;
};

// ── Step 3: Registration – set password ────────────────────────────────────
const setPassword = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) throw new AppError("User not found.", 404);
  if (!user.isVerified)
    throw new AppError(
      "Email not verified. Please complete OTP verification.",
      403,
    );
  if (user.registrationStep === "onboarded") {
    throw new AppError("Account setup is already complete.", 409);
  }

  user.password = password; // hashed by pre-save hook
  user.registrationStep = "credentials_set";
  await user.save();

  const token = signToken(user._id);
  return { token, user };
};

// ── Step 4: Onboarding – set name & organisation ───────────────────────────
const completeOnboarding = async (userId, name, organization) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);

  if (user.registrationStep === "pending") {
    throw new AppError(
      "Please complete email verification and password setup first.",
      403,
    );
  }

  user.name = name;
  user.organization = organization;
  user.registrationStep = "onboarded";
  await user.save();

  return user;
};

// ── Login with email + password ─────────────────────────────────────────────
const loginWithPassword = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.isVerified) {
    throw new AppError("Invalid credentials.", 401);
  }
  if (!user.password) {
    throw new AppError(
      "This account uses OTP login. Please use OTP to sign in.",
      400,
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError("Invalid credentials.", 401);

  const token = signToken(user._id);
  return { token, user };
};

// ── Login with OTP – step 1: send OTP ──────────────────────────────────────
const initiateOTPLogin = async (email) => {
  const user = await User.findOne({ email, isVerified: true });
  if (!user) {
    // Do not reveal whether the email exists
    throw new AppError(
      "If this email is registered, an OTP will be sent.",
      200,
    );
  }

  const otp = generateOTP(6);
  await OTP.upsertOTP(email, otp, "login");
  await sendOTPEmail(email, otp, "login");
};

// ── Login with OTP – step 2: verify OTP ────────────────────────────────────
const verifyLoginOTP = async (email, code) => {
  const otpRecord = await OTP.findOne({ email, purpose: "login" });
  if (!otpRecord) {
    throw new AppError(
      "OTP not found or has expired. Please request a new one.",
      400,
    );
  }
  if (otpRecord.code !== code) {
    throw new AppError("Invalid OTP. Please try again.", 400);
  }

  await OTP.deleteMany({ email, purpose: "login" });

  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found.", 404);

  const token = signToken(user._id);
  return { token, user };
};

module.exports = {
  initiateRegistration,
  verifyRegistrationOTP,
  setPassword,
  completeOnboarding,
  loginWithPassword,
  initiateOTPLogin,
  verifyLoginOTP,
};
