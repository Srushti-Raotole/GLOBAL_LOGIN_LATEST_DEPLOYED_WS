import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveAuthData } from "./api";

function decodeJwtPayload(token: string): any {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    throw new Error("Invalid SSO response");
  }
}

type ViewState = "loading" | "error";

export default function SSOCallbackPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<ViewState>("loading");
  const [errorTitle, setErrorTitle] = useState("Sign-in Failed");
  const [errorMessage, setErrorMessage] = useState(
    "We couldn't complete your sign-in. Please try again or contact your administrator."
  );

  useEffect(() => {
    let cancelled = false;

    async function handleSSO() {
      try {
        const params = new URLSearchParams(window.location.search);

        // Backend can redirect here with ?error=... on SSO failure
        const errParam = params.get("error");
        if (errParam) {
          throw Object.assign(new Error(prettifyError(errParam)), {
            title: titleForError(errParam),
          });
        }

        // Read token from URL query string or hash
        let token = params.get("token");
        if (!token) {
          const hashParams = new URLSearchParams(
            window.location.hash.replace("#", "?")
          );
          token = hashParams.get("token");
        }

        if (!token) throw new Error("No token received from SSO");

        const payload = decodeJwtPayload(token);
        const username = payload.sub;
        const portalAccess = payload.portalAccess ?? [];
        const portalRoles = payload.portalRoles ?? {};

        if (!username) throw new Error("Invalid SSO token");

        saveAuthData({ username, token, portalAccess, portalRoles });

        if (cancelled) return;

        toast({ title: "SSO Login Successful", description: `Welcome, ${username}` });
        window.location.href = "/globallogintest/portals";
      } catch (err: any) {
        if (cancelled) return;
        console.error("SSO callback failed:", err);
        setErrorTitle(err?.title ?? "Sign-in Failed");
        setErrorMessage(
          err?.message ??
            "We couldn't complete your sign-in. Please try again or contact your administrator."
        );
        setView("error");
      }
    }

    handleSSO();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (view === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e27] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b71d4c]" />
        <p className="text-white/70">Completing SSO authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#060a1e] via-[#0a0e27] to-[#120f24] p-4">
      <div className="w-full max-w-md">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/20 via-white/5 to-white/10 pointer-events-none" />
          <div className="relative bg-[#0f1328]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] p-8 text-center">
            <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-[#b71d4c]/15 border border-[#b71d4c]/30 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-[#ed8c38]" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">{errorTitle}</h1>
            <p className="text-sm text-white/60 leading-relaxed mb-6">{errorMessage}</p>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => navigate("/login", { replace: true })}
                className="w-full bg-gradient-to-r from-[#b71d4c] to-[#9a1840] hover:from-[#c92258] hover:to-[#b71d4c] text-white h-11 rounded-xl font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
              <p className="text-[15px] text-white/30 mt-3">
                If this keeps happening, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function titleForError(code: string): string {
  switch (code) {
    case "user_not_found":
    case "not_provisioned":
      return "Account Not Provisioned";
    case "access_denied":
      return "Access Denied";
    case "session_expired":
      return "Session Expired";
    default:
      return "Sign-in Failed";
  }
}

function prettifyError(code: string): string {
  switch (code) {
    case "user_not_found":
    case "not_provisioned":
      return "Your account isn't set up in this system yet. Please contact your administrator to request access.";
    case "access_denied":
      return "You don't have permission to access this application.";
    case "session_expired":
      return "Your session has expired. Please sign in again.";
    default:
      return "We couldn't complete your sign-in. Please try again or contact your administrator.";
  }
}
