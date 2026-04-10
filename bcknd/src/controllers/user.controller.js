const User = require("../models/User.model");
const asyncWrapper = require("../utils/asyncWrapper");

const updateProfile = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const { name } = req.body;

  const updateData = {};

  if (name !== undefined) {
    updateData.name = name.trim();
  }

  if (req.file) {
    updateData.avatar = req.file.path; // Cloudinary URL
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "User not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: {
      userId: user._id,
      email: user.email,
      name: user.name,
      organization: user.organization,
      avatar: user.avatar,
      registrationStep: user.registrationStep,
    },
  });
});

module.exports = {
  updateProfile,
};
