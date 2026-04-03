const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    name: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    registrationStep: {
      type: String,
      enum: ["pending", "credentials_set", "onboarded"],
      default: "pending",
    },

    // ── Google OAuth fields ──────────────────────────────────────────────
    googleId: {
      type: String,
      sparse: true, // allows multiple null values (only email/OTP users have null)
      unique: true,
    },
    avatar: {
      type: String, // Google profile picture URL
    },
    // Tracks how this account was originally created
    // 'local'  — registered via email OTP flow
    // 'google' — registered via Google OAuth
    authMethod: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  { timestamps: true },
);

// Hash password before saving if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
