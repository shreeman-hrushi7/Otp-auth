import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  registerInit,
  verifyRegistrationOTP,
  setPassword,
  completeOnboarding,
  saveToken,
  saveUser,
  getErrorMessage,
} from "@/lib/api";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/\d/, "Must include a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const onboardingSchema = z.object({
  name: z.string().min(2, "At least 2 characters").max(80),
  organization: z.string().min(2, "At least 2 characters").max(120),
});

// Google sign-in redirects to the backend which handles the full OAuth flow
const BACKEND_URL = "http://localhost:5000";
const handleGoogleSignIn = () => {
  window.location.href = `${BACKEND_URL}/api/auth/google`;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Email form ─────────────────────────────────────────────────────────
  const emailForm = useForm({ resolver: zodResolver(emailSchema) });

  const handleSendOTP = async ({ email: e }) => {
    setLoading(true);
    try {
      await registerInit(e);
      setEmail(e);
      setStep("otp");
      toast.success("OTP sent!", { description: `Check your inbox at ${e}` });
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error("Email already registered", {
          description: "This email exists. Please sign in instead.",
        });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error("Could not send OTP", {
          description: getErrorMessage(err),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── OTP verify ─────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the full 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await verifyRegistrationOTP(email, otp);
      toast.success("Verification complete!", {
        description: "Now set your password.",
      });
      setStep("password");
    } catch (err) {
      toast.error("Verification failed", { description: getErrorMessage(err) });
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await registerInit(email);
      setOtp("");
      toast.success("New code sent", {
        description: `Fresh OTP sent to ${email}`,
      });
    } catch (err) {
      toast.error("Could not resend", { description: getErrorMessage(err) });
    } finally {
      setResending(false);
    }
  };

  // ── Password form ──────────────────────────────────────────────────────
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });
  const passwordValue = passwordForm.watch("password", "");
  const strength = [
    passwordValue.length >= 8,
    /[A-Z]/.test(passwordValue),
    /[a-z]/.test(passwordValue),
    /\d/.test(passwordValue),
  ].filter(Boolean).length;
  const strengthColor = [
    "",
    "bg-red-400",
    "bg-amber-400",
    "bg-blue-400",
    "bg-green-500",
  ][strength];
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];

  const handleSetPassword = async ({ password }) => {
    setLoading(true);
    try {
      const res = await setPassword(email, password);
      saveToken(res.data.token);
      setStep("onboarding");
    } catch (err) {
      toast.error("Could not set password", {
        description: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Onboarding form ────────────────────────────────────────────────────
  const onboardingForm = useForm({ resolver: zodResolver(onboardingSchema) });

  const handleOnboarding = async ({ name, organization }) => {
    setLoading(true);
    try {
      const res = await completeOnboarding(name, organization);
      saveUser({ ...res.data.data, email });
      toast.success(`Welcome, ${name}!`, {
        description: "Your account is ready.",
      });
      navigate("/dashboard");
    } catch (err) {
      toast.error("Could not save profile", {
        description: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = { email: 0, otp: 1, password: 2, onboarding: 3 }[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 mb-4">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {step === "email" && "Enter your email to get started"}
            {step === "otp" && `Enter the code sent to ${email}`}
            {step === "password" && "Set a secure password"}
            {step === "onboarding" && "Almost done — tell us about yourself"}
          </p>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= stepIndex ? "w-6 bg-zinc-900" : "w-3 bg-zinc-200"
              }`}
            />
          ))}
        </div>

        <Card className="border-zinc-200 shadow-sm">
          {/* ── STEP 1: Email ── */}
          {step === "email" && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Get started</CardTitle>
                <CardDescription>
                  We'll send a verification code to your email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-zinc-200 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  {/* Google SVG icon */}
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                      fill="#4285F4"
                    />
                    <path
                      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                      fill="#34A853"
                    />
                    <path
                      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-zinc-400">or</span>
                  <Separator className="flex-1" />
                </div>

                <form
                  onSubmit={emailForm.handleSubmit(handleSendOTP)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoFocus
                      autoComplete="email"
                      {...emailForm.register("email")}
                      className={
                        emailForm.formState.errors.email ? "border-red-400" : ""
                      }
                    />
                    {emailForm.formState.errors.email && (
                      <p className="text-xs text-red-500">
                        {emailForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending
                        OTP…
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === "otp" && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">
                  Enter verification code
                </CardTitle>
                <CardDescription>
                  Sent to{" "}
                  <span className="font-medium text-zinc-700">{email}</span>.
                  Expires in 15 min.
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
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length < 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
                <p className="text-center text-sm text-zinc-500">
                  Didn't receive it?{" "}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="font-medium text-zinc-900 underline underline-offset-4 disabled:opacity-50"
                  >
                    {resending ? "Sending…" : "Resend code"}
                  </button>
                </p>
                <button
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" /> Use a different email
                </button>
              </CardContent>
            </>
          )}

          {/* ── STEP 3: Password ── */}
          {step === "password" && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Set your password</CardTitle>
                <CardDescription>
                  Min 8 chars, one uppercase, one lowercase, one number.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit(handleSetPassword)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        autoFocus
                        autoComplete="new-password"
                        {...passwordForm.register("password")}
                        className={`pr-10 ${passwordForm.formState.errors.password ? "border-red-400" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordValue.length > 0 && (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : "bg-zinc-100"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-zinc-400">{strengthLabel}</p>
                      </div>
                    )}
                    {passwordForm.formState.errors.password && (
                      <p className="text-xs text-red-500">
                        {passwordForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...passwordForm.register("confirmPassword")}
                        className={`pr-10 ${passwordForm.formState.errors.confirmPassword ? "border-red-400" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-500">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* ── STEP 4: Onboarding ── */}
          {step === "onboarding" && (
            <>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Your profile</CardTitle>
                <CardDescription>
                  Tell us your name and organisation to finish setup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={onboardingForm.handleSubmit(handleOnboarding)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Aryan Dev"
                      autoFocus
                      autoComplete="name"
                      {...onboardingForm.register("name")}
                      className={
                        onboardingForm.formState.errors.name
                          ? "border-red-400"
                          : ""
                      }
                    />
                    {onboardingForm.formState.errors.name && (
                      <p className="text-xs text-red-500">
                        {onboardingForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="organization">Organisation</Label>
                    <Input
                      id="organization"
                      type="text"
                      placeholder="Acme Inc"
                      autoComplete="organization"
                      {...onboardingForm.register("organization")}
                      className={
                        onboardingForm.formState.errors.organization
                          ? "border-red-400"
                          : ""
                      }
                    />
                    {onboardingForm.formState.errors.organization && (
                      <p className="text-xs text-red-500">
                        {onboardingForm.formState.errors.organization.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                      </>
                    ) : (
                      "Complete setup"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        {step === "email" && (
          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-zinc-900 underline underline-offset-4"
            >
              Sign in
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
