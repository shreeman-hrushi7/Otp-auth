import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  EyeOff,
  LogIn,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  loginWithPassword,
  loginOTPInit,
  loginOTPVerify,
  saveToken,
  saveUser,
  getErrorMessage,
} from "@/lib/api";

const passwordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const otpEmailSchema = z.object({
  otpEmail: z.string().min(1, "Email is required").email("Enter a valid email"),
});

const BACKEND_URL = "http://localhost:5000";
const handleGoogleSignIn = () => {
  window.location.href = `${BACKEND_URL}/api/auth/google`;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [otpMode, setOtpMode] = useState("hidden");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const passForm = useForm({ resolver: zodResolver(passwordSchema) });

  const handlePasswordLogin = async ({ email, password }) => {
    setPassLoading(true);
    try {
      const res = await loginWithPassword(email, password);
      saveToken(res.data.token);
      saveUser(res.data.data);
      toast.success("Welcome back!", {
        description: res.data.data?.name
          ? `Good to see you, ${res.data.data.name}`
          : "Signed in successfully.",
      });
      navigate("/dashboard");
    } catch (err) {
      toast.error("Login failed", { description: getErrorMessage(err) });
    } finally {
      setPassLoading(false);
    }
  };

  const otpEmailForm = useForm({ resolver: zodResolver(otpEmailSchema) });

  const handleSendOTP = async ({ otpEmail: e }) => {
    setOtpLoading(true);
    try {
      await loginOTPInit(e);
      setOtpEmail(e);
      setOtp("");
      setOtpMode("otp");
      toast.success("OTP sent!", { description: `Check your inbox at ${e}` });
    } catch (err) {
      toast.error("Could not send OTP", { description: getErrorMessage(err) });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the full 6-digit code");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await loginOTPVerify(otpEmail, otp);
      saveToken(res.data.token);
      saveUser(res.data.data);
      toast.success("Login successful!", {
        description: res.data.data?.name
          ? `Welcome back, ${res.data.data.name}`
          : "You are signed in.",
      });
      navigate("/dashboard");
    } catch (err) {
      toast.error("Verification failed", { description: getErrorMessage(err) });
      setOtp("");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await loginOTPInit(otpEmail);
      setOtp("");
      toast.success("New code sent", {
        description: `Fresh OTP sent to ${otpEmail}`,
      });
    } catch (err) {
      toast.error("Could not resend", { description: getErrorMessage(err) });
    } finally {
      setResending(false);
    }
  };

  const toggleOTPMode = () => {
    if (otpMode === "hidden") {
      setOtpMode("email");
    } else {
      setOtpMode("hidden");
      setOtp("");
      otpEmailForm.reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 mb-4">
            <LogIn className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Sign in to your account
          </p>
        </div>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign in</CardTitle>
            <CardDescription>
              Use your email and password, a one-time code, or Google.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-zinc-200 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
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
              <span className="text-xs text-zinc-400 whitespace-nowrap">
                or
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Password login */}
            <form
              onSubmit={passForm.handleSubmit(handlePasswordLogin)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  {...passForm.register("email")}
                  className={
                    passForm.formState.errors.email ? "border-red-400" : ""
                  }
                />
                {passForm.formState.errors.email && (
                  <p className="text-xs text-red-500">
                    {passForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...passForm.register("password")}
                    className={`pr-10 ${passForm.formState.errors.password ? "border-red-400" : ""}`}
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
                {passForm.formState.errors.password && (
                  <p className="text-xs text-red-500">
                    {passForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={passLoading}>
                {passLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-zinc-400 whitespace-nowrap">
                or
              </span>
              <Separator className="flex-1" />
            </div>

            {/* OTP toggle */}
            <button
              type="button"
              onClick={toggleOTPMode}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <span>Sign in with OTP</span>
              {otpMode === "hidden" ? (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {otpMode !== "hidden" && (
              <div className="space-y-4 pt-1 border-t border-zinc-100">
                {otpMode === "email" && (
                  <form
                    onSubmit={otpEmailForm.handleSubmit(handleSendOTP)}
                    className="space-y-3 pt-2"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="otpEmail">Your email</Label>
                      <Input
                        id="otpEmail"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoFocus
                        {...otpEmailForm.register("otpEmail")}
                        className={
                          otpEmailForm.formState.errors.otpEmail
                            ? "border-red-400"
                            : ""
                        }
                      />
                      {otpEmailForm.formState.errors.otpEmail && (
                        <p className="text-xs text-red-500">
                          {otpEmailForm.formState.errors.otpEmail.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full"
                      disabled={otpLoading}
                    >
                      {otpLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  </form>
                )}
                {otpMode === "otp" && (
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-zinc-500 text-center">
                      Code sent to{" "}
                      <span className="font-medium text-zinc-800">
                        {otpEmail}
                      </span>
                    </p>
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
                      disabled={otpLoading || otp.length < 6}
                    >
                      {otpLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Verifying…
                        </>
                      ) : (
                        "Verify & sign in"
                      )}
                    </Button>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setOtpMode("email");
                          setOtp("");
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        ← Change email
                      </button>
                      <button
                        onClick={handleResend}
                        disabled={resending}
                        className="text-xs font-medium text-zinc-700 underline underline-offset-4 disabled:opacity-50"
                      >
                        {resending ? "Sending…" : "Resend code"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don't have an account?{" "}
          <a
            href="/"
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
