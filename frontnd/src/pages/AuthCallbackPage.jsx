
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { saveToken, saveUser } from "@/lib/api";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const hasRun = useRef(false);
  // This effect should only run once, even if the component re-renders

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const token = params.get("token");

    window.history.replaceState({}, document.title, "/auth/callback");

    if (error) {
      toast.error("Google sign-in failed", {
        description: "Something went wrong. Please try again.",
      });
      navigate("/login", { replace: true });
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

      toast.success("Signed in with Google!", {
        description: params.get("name")
          ? `Welcome, ${params.get("name")}`
          : "You are signed in.",
      });

      navigate("/dashboard", { replace: true });
      return;
    }

    toast.error("Sign-in failed", {
      description: "Please try again.",
    });
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
