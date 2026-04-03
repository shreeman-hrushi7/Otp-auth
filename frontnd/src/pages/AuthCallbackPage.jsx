import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { saveToken, saveUser } from "@/lib/api";

/**
 * This page is the landing point after Google OAuth.
 * Google → backend → redirects here with ?token=... or ?error=...
 * We read the URL params, store the token, and send the user to the dashboard.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const token = params.get("token");

    if (error) {
      if (error === "EMAIL_EXISTS_LOCAL") {
        toast.error("Email already registered", {
          description:
            "This email is registered with password or OTP. Please sign in using that method.",
        });
        navigate("/login", { replace: true });
      } else {
        toast.error("Google sign-in failed", {
          description: "Something went wrong. Please try again.",
        });
        navigate("/login", { replace: true });
      }
      return;
    }

    if (token) {
      saveToken(token);
      saveUser({
        name: params.get("name") || "",
        email: params.get("email") || "",
        organization: params.get("organization") || "",
        registrationStep: params.get("registrationStep") || "onboarded",
      });

      const name = params.get("name");
      toast.success("Signed in with Google!", {
        description: name ? `Welcome, ${name}` : "You are signed in.",
      });
      navigate("/dashboard", { replace: true });
      return;
    }

    // No token, no error — something unexpected
    toast.error("Sign-in failed", { description: "Please try again." });
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}
