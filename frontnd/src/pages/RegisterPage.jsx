import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  registerInit,
  verifyRegistrationOTP,
  setPassword,
  completeOnboarding,
  saveToken,
  saveUser,
  getErrorMessage,
} from '@/lib/api'

// ── Step 1 schema ──────────────────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

// ── Step 3 schema (password) ───────────────────────────────────────────────
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/\d/, 'Must include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// ── Step 4 schema (onboarding) ─────────────────────────────────────────────
const onboardingSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(80),
  organization: z.string().min(2, 'At least 2 characters').max(120),
})

// ── Steps: 'email' | 'otp' | 'password' | 'onboarding' ───────────────────
export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ── Email form ─────────────────────────────────────────────────────────
  const emailForm = useForm({ resolver: zodResolver(emailSchema) })

  const handleSendOTP = async ({ email: e }) => {
    setLoading(true)
    try {
      await registerInit(e)
      setEmail(e)
      setStep('otp')
      toast.success('OTP sent!', { description: `Check your inbox at ${e}` })
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.info('Already registered', {
          description: 'This email exists. Redirecting to login.',
        })
        setTimeout(() => navigate('/login'), 1500)
      } else {
        toast.error('Could not send OTP', { description: getErrorMessage(err) })
      }
    } finally {
      setLoading(false)
    }
  }

  // ── OTP verify ─────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the full 6-digit code')
      return
    }
    setLoading(true)
    try {
      await verifyRegistrationOTP(email, otp)
      toast.success('Verification complete!', {
        description: 'Now set a password for your account.',
      })
      setStep('password')
    } catch (err) {
      toast.error('Verification failed', { description: getErrorMessage(err) })
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await registerInit(email)
      setOtp('')
      toast.success('New code sent', { description: `Fresh OTP sent to ${email}` })
    } catch (err) {
      toast.error('Could not resend', { description: getErrorMessage(err) })
    } finally {
      setResending(false)
    }
  }

  // ── Password form ──────────────────────────────────────────────────────
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })
  const passwordValue = passwordForm.watch('password', '')
  const strength = [
    passwordValue.length >= 8,
    /[A-Z]/.test(passwordValue),
    /[a-z]/.test(passwordValue),
    /\d/.test(passwordValue),
  ].filter(Boolean).length
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'][strength]
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]

  const handleSetPassword = async ({ password }) => {
    setLoading(true)
    try {
      const res = await setPassword(email, password)
      saveToken(res.data.token)
      setStep('onboarding')
    } catch (err) {
      toast.error('Could not set password', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  // ── Onboarding form ────────────────────────────────────────────────────
  const onboardingForm = useForm({ resolver: zodResolver(onboardingSchema) })

  const handleOnboarding = async ({ name, organization }) => {
    setLoading(true)
    try {
      const res = await completeOnboarding(name, organization)
      saveUser({ ...res.data.data, email })
      toast.success(`Welcome, ${name}!`, { description: 'Your account is ready.' })
      navigate('/dashboard')
    } catch (err) {
      toast.error('Could not save profile', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  // ── Step indicator ─────────────────────────────────────────────────────
  const steps = ['Email', 'Verify', 'Password', 'Profile']
  const stepIndex = { email: 0, otp: 1, password: 2, onboarding: 3 }[step]

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 mb-4">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {step === 'email' && 'Enter your email to get started'}
            {step === 'otp' && `Enter the code sent to ${email}`}
            {step === 'password' && 'Set a secure password'}
            {step === 'onboarding' && 'Almost done — tell us about yourself'}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                i < stepIndex
                  ? 'w-6 bg-zinc-900'
                  : i === stepIndex
                  ? 'w-6 bg-zinc-900'
                  : 'w-3 bg-zinc-200'
              }`} />
            </div>
          ))}
        </div>

        <Card className="border-zinc-200 shadow-sm">

          {/* ── STEP 1: Email ── */}
          {step === 'email' && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Get started</CardTitle>
                <CardDescription>We'll send a verification code to your email.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={emailForm.handleSubmit(handleSendOTP)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoFocus
                      autoComplete="email"
                      {...emailForm.register('email')}
                      className={emailForm.formState.errors.email ? 'border-red-400' : ''}
                    />
                    {emailForm.formState.errors.email && (
                      <p className="text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP…</>
                      : 'Send OTP'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Enter verification code</CardTitle>
                <CardDescription>
                  6-digit code sent to <span className="font-medium text-zinc-700">{email}</span>. Expires in 15 min.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleVerifyOTP}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length < 6}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                    : 'Verify OTP'}
                </Button>
                <p className="text-center text-sm text-zinc-500">
                  Didn't receive it?{' '}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="font-medium text-zinc-900 underline underline-offset-4 disabled:opacity-50"
                  >
                    {resending ? 'Sending…' : 'Resend code'}
                  </button>
                </p>
                <button
                  onClick={() => { setStep('email'); setOtp('') }}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" /> Use a different email
                </button>
              </CardContent>
            </>
          )}

          {/* ── STEP 3: Password ── */}
          {step === 'password' && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Set your password</CardTitle>
                <CardDescription>Min 8 chars, one uppercase, one lowercase, one number.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(handleSetPassword)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoFocus
                        autoComplete="new-password"
                        {...passwordForm.register('password')}
                        className={`pr-10 ${passwordForm.formState.errors.password ? 'border-red-400' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordValue.length > 0 && (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex gap-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-zinc-100'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-zinc-400">{strengthLabel}</p>
                      </div>
                    )}
                    {passwordForm.formState.errors.password && (
                      <p className="text-xs text-red-500">{passwordForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...passwordForm.register('confirmPassword')}
                        className={`pr-10 ${passwordForm.formState.errors.confirmPassword ? 'border-red-400' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : 'Continue'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* ── STEP 4: Onboarding ── */}
          {step === 'onboarding' && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Your profile</CardTitle>
                <CardDescription>Tell us your name and organisation to finish setup.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onboardingForm.handleSubmit(handleOnboarding)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Aryan Dev"
                      autoFocus
                      autoComplete="name"
                      {...onboardingForm.register('name')}
                      className={onboardingForm.formState.errors.name ? 'border-red-400' : ''}
                    />
                    {onboardingForm.formState.errors.name && (
                      <p className="text-xs text-red-500">{onboardingForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="organization">Organisation</Label>
                    <Input
                      id="organization"
                      type="text"
                      placeholder="Acme Inc"
                      autoComplete="organization"
                      {...onboardingForm.register('organization')}
                      className={onboardingForm.formState.errors.organization ? 'border-red-400' : ''}
                    />
                    {onboardingForm.formState.errors.organization && (
                      <p className="text-xs text-red-500">{onboardingForm.formState.errors.organization.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : 'Complete setup'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

        </Card>

        {step === 'email' && (
          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-zinc-900 underline underline-offset-4">
              Sign in
            </a>
          </p>
        )}

      </div>
    </div>
  )
}
