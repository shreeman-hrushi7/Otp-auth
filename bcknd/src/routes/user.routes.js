const express = require("express");
const router = express.Router();

const { updateProfile } = require("../controllers/user.controller");
const upload = require("../middlewares/upload");
const protect = require("../middlewares/authenticate");

// PUT /api/user/profile
router.put("/profile", protect, upload.single("avatar"), updateProfile);

module.exports = router;
