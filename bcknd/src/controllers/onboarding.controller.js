const authService = require("../services/auth.service");
const asyncWrapper = require("../utils/asyncWrapper");

// PATCH /api/onboarding
const completeOnboarding = asyncWrapper(async (req, res) => {
  const { name, organization } = req.body;
  const user = await authService.completeOnboarding(
    req.user._id,
    name,
    organization,
  );

  res.status(200).json({
    status: "success",
    message: "Onboarding complete. Welcome!",
    data: {
      userId: user._id,
      email: user.email,
      name: user.name,
      organization: user.organization,
      registrationStep: user.registrationStep,
    },
  });
});

module.exports = { completeOnboarding };
