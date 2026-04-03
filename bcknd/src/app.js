require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("./config/passport");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const onboardingRoutes = require("./routes/onboarding.routes");
const errorHandler = require("./middlewares/errorHandler");
const AppError = require("./utils/AppError");

const app = express();

// ── Security & parsing ─────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Session — needed by Passport for the OAuth redirect round-trip ─────────
// Sessions are ONLY used during the Google OAuth handshake (2 requests).
// All ongoing auth uses JWT — sessions are not kept after that.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true in production (requires HTTPS)
      httpOnly: true,
      maxAge: 5 * 60 * 1000, // 5 minutes — only needed for OAuth handshake
    },
  }),
);

// ── Passport ───────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────
app.all("*", (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ── Global error handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
  });
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.message);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err.message);
  process.exit(1);
});

module.exports = app;
