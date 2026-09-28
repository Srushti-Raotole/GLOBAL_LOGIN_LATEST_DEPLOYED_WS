// Security Issue Fix - Centralized sessionStorage token handler for GLOBAL_LOGIN_UI.
// All auth token reads/writes/clears go through here instead of scattered localStorage calls.

const TOKEN_KEY = "LS_AUTH_TOKEN";
const USER_KEY = "LS_AUTH_USER";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getUser(): string | null {
  return sessionStorage.getItem(USER_KEY);
}

export function setUser(userJson: string): void {
  sessionStorage.setItem(USER_KEY, userJson);
}

export function removeToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function removeUser(): void {
  sessionStorage.removeItem(USER_KEY);
}

export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
