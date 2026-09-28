// =============================================================================
// Global User Management — API
// Covers: User list, create, edit, delete, status toggle, bulk import, logout.
// All endpoints are under AUTH_BASE_URL (/v1/users).
// =============================================================================

import axios from "axios";
import { AUTH_BASE_URL } from "../api";
import type {
  UserRow,
  UserDetail,
  CreateUserPayload,
  UpdateUserPayload,
  BulkImportResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Axios instance
// Attaches the session JWT from sessionStorage on every request.
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
// User List  (pages/UserManagement/UserListPage.tsx)
// ---------------------------------------------------------------------------

// Security Issue Fix - X-API-JWT secondary token and hardcoded USERS_FULL_API_KEY removed.
// /v1/users/full is now protected by the same Bearer JWT as all other endpoints
// (enforced by Spring Security on the backend). The axios interceptor above
// already attaches the session JWT — no additional token needed.
/** GET /v1/users/full — full user record including portalRoles per user. */
export async function fetchAllUsersFull(): Promise<UserRow[]> {
  const res = await api.get<UserRow[]>("/v1/users/full");
  return res.data;
}

/** GET /v1/users — basic user list without portalRoles. */
export async function fetchAllUsers(): Promise<UserRow[]> {
  const res = await api.get<UserRow[]>("/v1/users");
  return res.data;
}

/** GET /v1/users/:id — full detail for one user. */
export async function fetchUserById(id: number): Promise<UserDetail> {
  const res = await api.get<UserDetail>(`/v1/users/${id}`);
  return res.data;
}

// ---------------------------------------------------------------------------
// Create / Edit User  (pages/UserManagement/CreateUserDialog.tsx or similar)
// ---------------------------------------------------------------------------

/** POST /v1/users — create a new user. */
export async function createUser(payload: CreateUserPayload): Promise<string> {
  const res = await api.post<string>("/v1/users", payload);
  return res.data;
}

/** PUT /v1/users/:id — update an existing user. */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<string> {
  const res = await api.put<string>(`/v1/users/${id}`, payload);
  return res.data;
}

// ---------------------------------------------------------------------------
// Delete User  (pages/UserManagement/UserListPage.tsx — delete action)
// ---------------------------------------------------------------------------

/** DELETE /v1/users/:id */
export async function deleteUser(id: number): Promise<string> {
  const res = await api.delete<string>(`/v1/users/${id}`);
  return res.data;
}

// ---------------------------------------------------------------------------
// User Status  (pages/UserManagement/UserListPage.tsx — enable/disable toggle)
// ---------------------------------------------------------------------------

/** PATCH /v1/users/:id/status — toggle enabled/disabled. */
export async function toggleUserStatus(id: number): Promise<string> {
  const res = await api.patch<string>(`/v1/users/${id}/status`);
  return res.data;
}

// ---------------------------------------------------------------------------
// User Session Logout  (pages/UserManagement/UserListPage.tsx — force logout)
// ---------------------------------------------------------------------------

/** POST /v1/users/:id/logout — mark a specific user as logged out. */
export async function logoutUser(id: number): Promise<string> {
  const res = await api.post<string>(`/v1/users/${id}/logout`);
  return res.data;
}

// ---------------------------------------------------------------------------
// Bulk Import  (pages/UserManagement/BulkImportDialog.tsx or similar)
// ---------------------------------------------------------------------------

/** POST /v1/users/bulk-import (multipart) — import users from a CSV/Excel file. */
export async function bulkImportUsers(file: File): Promise<BulkImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<BulkImportResponse>("/v1/users/bulk-import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
