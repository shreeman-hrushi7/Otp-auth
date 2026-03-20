import axios from 'axios'

// ── Axios instance ─────────────────────────────────────────────────────────
// baseURL is empty because vite.config.js proxies /api → http://localhost:5000
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request automatically if one exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Registration flow ──────────────────────────────────────────────────────

/** Step 1 — submit email, trigger OTP email */
export const registerInit = (email) =>
  api.post('/auth/register/init', { email })

/** Step 2 — verify the OTP received in email */
export const verifyRegistrationOTP = (email, otp) =>
  api.post('/auth/register/verify-otp', { email, otp })

/** Step 3 — set password after OTP verified */
export const setPassword = (email, password) =>
  api.post('/auth/register/set-password', { email, password })

/** Step 4 — complete onboarding (protected — needs token) */
export const completeOnboarding = (name, organization) =>
  api.patch('/onboarding', { name, organization })

// ── Login flow ─────────────────────────────────────────────────────────────

/** Login with email + password */
export const loginWithPassword = (email, password) =>
  api.post('/auth/login/password', { email, password })

/** OTP login step 1 — send OTP */
export const loginOTPInit = (email) =>
  api.post('/auth/login/otp/init', { email })

/** OTP login step 2 — verify OTP */
export const loginOTPVerify = (email, otp) =>
  api.post('/auth/login/otp/verify', { email, otp })

// ── Helpers ────────────────────────────────────────────────────────────────

/** Save token to localStorage after successful login/register */
export const saveToken = (token) => localStorage.setItem('token', token)

/** Save user profile data to localStorage */
export const saveUser = (userData) =>
  localStorage.setItem('user', JSON.stringify(userData))

/** Remove token — used on logout */
export const clearToken = () => localStorage.removeItem('token')

/** Extract a readable error message from an axios error */
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  )
}
