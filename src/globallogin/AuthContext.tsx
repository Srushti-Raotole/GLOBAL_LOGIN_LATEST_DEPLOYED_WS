import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  AuthUser,
  AuthResponse,
  getStoredUser,
  getStoredToken,
  saveAuthData,
  isAuthenticated as checkAuth,
  loginWithCredentials,
  clearAuthData,
  hasPortalAccess,
  getPortalRoles,
  markCurrentUserOffline,
  fetchCurrentUser,
  AUTH_BASE_URL,
} from "./api";

// ── Context Type ──
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasAccess: (portalId: string) => boolean;
  getRoles: (portalId: string) => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Security Issue Fix - Silent token renewal constants. Token expires in 30 min; renew 5 min early.
const RENEW_BEFORE_MS = 5 * 60 * 1000;

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

// ── Provider ──
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const renewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Security Issue Fix - Silent token renewal. Runs every 25 minutes while user is logged in.
  // Covers portal selection page, user management page, and all authenticated routes.
  // Calls POST /v1/apiauth/renew on GlobalLogin_Backend using the existing api axios instance.
  const scheduleRenew = useCallback(() => {
    if (renewTimerRef.current) clearTimeout(renewTimerRef.current);

    const token = sessionStorage.getItem("LS_AUTH_TOKEN");
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const delay = expiry - Date.now() - RENEW_BEFORE_MS;

    const doRenew = async () => {
      try {
        const currentToken = sessionStorage.getItem("LS_AUTH_TOKEN");
        if (!currentToken) return;

        const res = await fetch(`${AUTH_BASE_URL}/v1/apiauth/renew`, {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
        });

        if (!res.ok) throw new Error("Renew failed");

        const data = await res.json();
        const stored = getStoredToken();
        if (stored && data.token) {
          // Preserve all user data; only update the token
          const currentUser = getStoredUser();
          if (currentUser) {
            saveAuthData({
              username: currentUser.username,
              token: data.token,
              portalAccess: currentUser.portalAccess,
              portalRoles: currentUser.portalRoles,
              portalAttributes: currentUser.portalAttributes,
            });
          } else {
            sessionStorage.setItem("LS_AUTH_TOKEN", data.token);
          }
        }

        console.log("[TokenRenew] Global Login token renewed silently.");
        scheduleRenew(); // schedule next cycle
      } catch {
        console.warn("[TokenRenew] Renewal failed — clearing session.");
        clearAuthData();
        setUser(null);
        window.location.href = "/globallogintest/login";
      }
    };

    if (delay <= 0) {
      doRenew();
    } else {
      console.log(`[TokenRenew] Next renewal at ${new Date(Date.now() + delay).toLocaleTimeString()}.`);
      renewTimerRef.current = setTimeout(() => doRenew(), delay);
    }
  }, []);

  // Syncs fresh user permissions from the backend API
  const refreshUser = useCallback(async () => {
    if (!checkAuth()) return;
    try {
      const updatedUser = await fetchCurrentUser();
      setUser(updatedUser);
    } catch (err) {
      console.error("Failed to refresh user permissions:", err);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("logout") === "1") {
      clearAuthData();
      setUser(null);
      setIsLoading(false);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (checkAuth()) {
      setUser(getStoredUser());
      // Fetch latest roles in the background immediately on mount
      refreshUser();
      // Security Issue Fix - Start the 25-min silent renewal timer when the user is authenticated.
      scheduleRenew();
    }
    setIsLoading(false);

    return () => {
      if (renewTimerRef.current) clearTimeout(renewTimerRef.current);
    };
  }, [refreshUser, scheduleRenew]);

  // Auto-sync permissions when window regains focus or user switches back to this tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && checkAuth()) {
        refreshUser();
      }
    };
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginWithCredentials(username, password);
    const authUser: AuthUser = {
      username: response.username,
      portalAccess: response.portalAccess,
      portalRoles: response.portalRoles,
      portalAttributes: response.portalAttributes ?? {},
      isGlobal: response.portalAccess.includes("GLOBAL"),
    };
    setUser(authUser);
    // Security Issue Fix - Start renewal timer immediately after login.
    scheduleRenew();
    return response;
  }, [scheduleRenew]);

  const logout = useCallback(async () => {
    // Security Issue Fix - Cancel the renewal timer before clearing the session.
    if (renewTimerRef.current) clearTimeout(renewTimerRef.current);
    try {
      await markCurrentUserOffline();
    } catch (e) {
      console.error("Failed to mark offline during logout", e);
    }
    clearAuthData();
    setUser(null);
  }, []);

  const hasAccess = useCallback(
    (portalId: string) => hasPortalAccess(user, portalId),
    [user]
  );

  const getRoles = useCallback(
    (portalId: string) => getPortalRoles(user, portalId),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && checkAuth(),
        isLoading,
        login,
        logout,
        refreshUser,
        hasAccess,
        getRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ── Auth Guard (protects routes) ──
export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}