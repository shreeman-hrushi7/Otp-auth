const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User.model");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
      passReqToCallback: false,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();

        if (!email) {
          return done(null, false, { message: "NO_EMAIL" });
        }

        const existing = await User.findOne({ email });

        if (existing) {
          if (!existing.googleId) {
            existing.googleId = profile.id;
          }

          if (!existing.avatar) {
            existing.avatar = profile.photos?.[0]?.value || "";
          }

          if (!existing.name && profile.displayName) {
            existing.name = profile.displayName;
          }

          if (!existing.isVerified) {
            existing.isVerified = true;
          }

          await existing.save();
          return done(null, existing);
        }

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
