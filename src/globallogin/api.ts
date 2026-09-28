// =============================================================================
// Global Login — Auth API
// Covers: Login Page, SSO, token verification, session helpers, logout.
// =============================================================================

import axios from "axios";

// ---------------------------------------------------------------------------
// Base URLs
// Switch the active line to switch environments.
// ---------------------------------------------------------------------------
// export const AUTH_BASE_URL = "https://ngossprod.lightstorm.in/globalsaml";  // production
// export const AUTH_BASE_URL = "http://10.27.144.225:7071/globalsaml";        // staging
export const AUTH_BASE_URL = "http://10.27.144.225:7071/globalsamltest";       // test

export const SSO_REDIRECT_URL = `${AUTH_BASE_URL}/saml2/authenticate/aws-sso`;

// ---------------------------------------------------------------------------
// Axios instance
// Attaches the session JWT on every request.
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Security: read token from sessionStorage (cleared on tab close) not localStorage.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("LS_AUTH_TOKEN");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------------------------------------------------------------------------
// Types / Interfaces
// ---------------------------------------------------------------------------
export type PortalId = "INDIA_OSS" | "IP" | "SOM" | "GLOBAL" | "APAC_OSS";

export type PortalAttributes = Record<string, Record<string, string[]>>;

export interface AuthResponse {
  username: string;
  token: string;
  portalAccess: PortalId[];
  portalRoles: Record<string, string[]>;
  portalAttributes?: PortalAttributes;
}

export interface VerifyTokenResponse {
  username: string;
  portalAccess: PortalId[];
  portalRoles: Record<string, string[]>;
  portalAttributes?: PortalAttributes;
  valid: boolean;
}

export interface UserInfoResponse {
  username: string;
  portalAccess: PortalId[];
  portalRoles: Record<string, string[]>;
  portalAttributes?: PortalAttributes;
}

export interface AuthUser {
  username: string;
  portalAccess: PortalId[];
  portalRoles: Record<string, string[]>;
  portalAttributes?: PortalAttributes;
  isGlobal: boolean;
}

// ---------------------------------------------------------------------------
// Portal routing — maps URL slugs to portal IDs
// Used by the portal selector / redirect logic.
// ---------------------------------------------------------------------------
export const PORTAL_ID_MAP: Record<string, PortalId> = {
  "india-noc": "INDIA_OSS",
  ip: "IP",
  som: "SOM",
  "global-users": "GLOBAL",
  apac: "APAC_OSS",
};

// ---------------------------------------------------------------------------
// Session storage helpers
// Security: all auth data is kept in sessionStorage (not localStorage) so it
// is automatically cleared when the browser tab closes.
// ---------------------------------------------------------------------------
const TOKEN_KEY = "LS_AUTH_TOKEN";
const USER_KEY  = "LS_AUTH_USER";

export function saveAuthData(res: AuthResponse): void {
  sessionStorage.setItem(TOKEN_KEY, res.token);
  sessionStorage.setItem(
    USER_KEY,
    JSON.stringify({
      username: res.username,
      portalAccess: res.portalAccess,
      portalRoles: res.portalRoles,
      portalAttributes: res.portalAttributes ?? {},
      isGlobal: res.portalAccess.includes("GLOBAL"),
    })
  );
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export function clearAuthData(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// ---------------------------------------------------------------------------
// Portal access helpers
// Used by the portal selector and route guards.
// ---------------------------------------------------------------------------
export function hasPortalAccess(user: AuthUser | null, portalId: string): boolean {
  if (!user) return false;
  return user.portalAccess.includes(portalId as PortalId);
}

export function getPortalRoles(user: AuthUser | null, portalId: string): string[] {
  if (!user) return [];
  return user.portalRoles[portalId] ?? [];
}

// ---------------------------------------------------------------------------
// Login Page — credential-based login  (pages/Login/LoginPage.tsx or similar)
// POST /v1/auth/login
// Security: mock admin/admin fallback removed — no unauthenticated access.
// ---------------------------------------------------------------------------
export async function loginWithCredentials(
  username: string,
  password: string
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/v1/auth/login", { username, password });
  saveAuthData(res.data);
  return res.data;
}

// ---------------------------------------------------------------------------
// SSO Login  (Login Page — "Login with SSO" button)
// Redirects browser to the AWS SSO IdP; no response to handle here.
// ---------------------------------------------------------------------------
export function loginWithSSO(): void {
  window.location.href = SSO_REDIRECT_URL;
}

// ---------------------------------------------------------------------------
// SSO Callback  (pages/SSOCallback/SSOCallbackPage.tsx or similar)
// GET /me — backend sets the JWT cookie after the IdP redirect.
// ---------------------------------------------------------------------------
export async function fetchSSOUserProfile(): Promise<AuthResponse> {
  const res = await api.get<AuthResponse>("/me");
  saveAuthData(res.data);
  return res.data;
}

// ---------------------------------------------------------------------------
// Current user — reads from sessionStorage (no network call).
// The backend /v1/integration/userinfo endpoint does not exist; user data
// is already stored at login time by saveAuthData().
// ---------------------------------------------------------------------------
export async function fetchCurrentUser(): Promise<AuthUser> {
  const stored = getStoredUser();
  if (stored) return stored;
  throw new Error("No authenticated user found");
}

// ---------------------------------------------------------------------------
// Token verification — Integration endpoint  (called by other portals)
// POST /v1/integration/verify-token
// Portals call this to validate a JWT forwarded from the global login session.
// ---------------------------------------------------------------------------
export async function verifyToken(token?: string): Promise<VerifyTokenResponse> {
  const jwt = token ?? getStoredToken();
  if (!jwt) throw new Error("No token available");
  const res = await api.post<VerifyTokenResponse>("/v1/integration/verify-token", { token: jwt });
  return res.data;
}

// ---------------------------------------------------------------------------
// Health check  (used by connectivity indicators / startup checks)
// GET /health
// ---------------------------------------------------------------------------
export async function checkAuthHealth(): Promise<boolean> {
  try {
    const res = await api.get("/health");
    return res.status === 200;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Logout  (Header / user menu — "Logout" button)
// Marks the user offline in the backend, clears session, redirects to login.
// ---------------------------------------------------------------------------
export async function markCurrentUserOffline(): Promise<void> {
  try {
    const user = getStoredUser();
    if (!user) return;
    const res = await api.get<Array<{ id: number; username: string }>>("/v1/users");
    const match = res.data.find(
      (u) => u.username?.toLowerCase() === user.username?.toLowerCase()
    );
    if (match?.id) {
      await api.post(`/v1/users/${match.id}/logout`);
    }
  } catch {}
}

export async function logout(): Promise<void> {
  await markCurrentUserOffline();
  clearAuthData();
  window.location.href = "/globallogintest/login";
}
