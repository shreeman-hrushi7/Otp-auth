import axios from "axios";

// baseURL is empty because vite.config.js proxies /api → http://localhost:5000
const api = axios.create({
  baseURL: "/api",
});

// Attach JWT to every request automatically if one exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Registration flow ──────────────────────────────────────────────────────

export const registerInit = (email) =>
  api.post("/auth/register/init", { email });

export const verifyRegistrationOTP = (email, otp) =>
  api.post("/auth/register/verify-otp", { email, otp });

export const setPassword = (email, password) =>
  api.post("/auth/register/set-password", { email, password });

export const completeOnboarding = (name, organization) =>
  api.patch("/onboarding", { name, organization });

// ── Login flow ─────────────────────────────────────────────────────────────

export const loginWithPassword = (email, password) =>
  api.post("/auth/login/password", { email, password });

export const loginOTPInit = (email) =>
  api.post("/auth/login/otp/init", { email });

export const loginOTPVerify = (email, otp) =>
  api.post("/auth/login/otp/verify", { email, otp });

// ── Profile update ─────────────────────────────────────────────────────────

export const updateProfile = (formData) =>
  api.put("/user/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// ── Helpers ────────────────────────────────────────────────────────────────

export const saveToken = (token) => localStorage.setItem("token", token);

export const saveUser = (userData) =>
  localStorage.setItem("user", JSON.stringify(userData));

export const clearToken = () => localStorage.removeItem("token");

export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};