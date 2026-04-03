const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User.model");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Hardcode the callback URL — must exactly match Google Console
      callbackURL: "http://localhost:5000/api/auth/google/callback",
      // Pass the request object to the verify callback
      passReqToCallback: false,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();

        if (!email) {
          return done(null, false, { message: "NO_EMAIL" });
        }

        // Check if this email already exists
        const existing = await User.findOne({ email });

        if (existing) {
          // Email registered via OTP/password — block Google login
          if (existing.authMethod === "local") {
            return done(null, false, { message: "EMAIL_EXISTS_LOCAL" });
          }
          // Existing Google user — log them in
          return done(null, existing);
        }

        // New user via Google — create account (skip OTP, already verified by Google)
        const newUser = await User.create({
          email,
          googleId: profile.id,
          name: profile.displayName || "",
          avatar: profile.photos?.[0]?.value || "",
          isVerified: true,
          authMethod: "google",
          registrationStep: "onboarded",
        });

        return done(null, newUser);
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);

// Sessions are used only during the OAuth handshake
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (err) {
    done(err, false);
  }
});

module.exports = passport;
