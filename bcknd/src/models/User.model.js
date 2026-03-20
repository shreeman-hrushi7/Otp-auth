const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// details of the user
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
      select: false, // excluded from queries by default
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
    // Tracks which step of registration the user is on
    // 'pending'    – email submitted, awaiting OTP
    // 'credentials_set' – OTP verified, password set
    // 'onboarded'  – name + org filled in

    registrationStep: {
      type: String,
      enum: ["pending", "credentials_set", "onboarded"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Hash password before saving if it has been modified
userSchema.pre("save", async function (next) {  // pre save hook -> before saving the user to db , we will hash the password
  if (!this.isModified("password")) return next(); // only hash if password is new or changed
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare a plain password with the stored hash
// Basically hashed password ko compare krna hai user ke input se
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
