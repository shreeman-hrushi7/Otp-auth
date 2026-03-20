const authService = require("../services/auth.service");
const asyncWrapper = require("../utils/asyncWrapper");

// POST /api/auth/register/init
const registerInit = asyncWrapper(async (req, res) => {
  const { email } = req.body;
  await authService.initiateRegistration(email);
  res.status(200).json({
    status: "success",
    message: "OTP sent to your email. It expires in 15 minutes.",
  });
});

// POST /api/auth/register/verify-otp
const registerVerifyOTP = asyncWrapper(async (req, res) => {
  const { email, otp } = req.body;
  await authService.verifyRegistrationOTP(email, otp);
  res.status(200).json({
    status: "success",
    message: "Email verified. Please set your password.",
  });
});

// POST /api/auth/register/set-password
const registerSetPassword = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.setPassword(email, password);
  res.status(200).json({
    status: "success",
    message: "Password set. Proceed to onboarding.",
    token,
    data: { userId: user._id, registrationStep: user.registrationStep },
  });
});

// POST /api/auth/login/password
const loginWithPassword = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.loginWithPassword(email, password);
  res.status(200).json({
    status: "success",
    token,
    data: {
      userId: user._id,
      email: user.email,
      name: user.name,
      organization: user.organization,
      registrationStep: user.registrationStep,
    },
  });
});

// POST /api/auth/login/otp/init
const loginOTPInit = asyncWrapper(async (req, res) => {
  const { email } = req.body;
  await authService.initiateOTPLogin(email);
  // Generic message to avoid email enumeration
  res.status(200).json({
    status: "success",
    message: "If this email is registered, an OTP has been sent.",
  });
});

// POST /api/auth/login/otp/verify
const loginOTPVerify = asyncWrapper(async (req, res) => {
  const { email, otp } = req.body;
  const { token, user } = await authService.verifyLoginOTP(email, otp);
  res.status(200).json({
    status: "success",
    token,
    data: {
      userId: user._id,
      email: user.email,
      name: user.name,
      organization: user.organization,
      registrationStep: user.registrationStep,
    },
  });
});

module.exports = {
  registerInit,
  registerVerifyOTP,
  registerSetPassword,
  loginWithPassword,
  loginOTPInit,
  loginOTPVerify,
};
