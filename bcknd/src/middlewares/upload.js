const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "avatars",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: `avatar-${req.user._id}-${Date.now()}`,
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, 
  },
});

module.exports = upload;
