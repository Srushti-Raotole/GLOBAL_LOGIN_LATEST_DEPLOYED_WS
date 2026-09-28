
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { AUTH_BASE_URL } from "../api";
import type { PortalRef, RoleRef } from "./types";
import { PORTALS as FALLBACK_PORTALS, ROLES as FALLBACK_ROLES } from "./types";

const api = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
api.interceptors.request.use((c) => {
  // Security Issue Fix - Read token from sessionStorage instead of localStorage.
  const t = sessionStorage.getItem("LS_AUTH_TOKEN");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

export async function fetchPortals(): Promise<PortalRef[]> {
  const res = await api.get<PortalRef[]>("/v1/portals");
  return res.data;
}

export async function fetchRoles(): Promise<RoleRef[]> {
  const res = await api.get<RoleRef[]>("/v1/roles");
  return res.data;
}

export interface PortalAttributeDef {
  id: number;
  portal_id: number;
  attr_key: string;     
  attr_value: string;   
}

export async function fetchPortalAttributes(): Promise<PortalAttributeDef[]> {
  const res = await api.get<PortalAttributeDef[]>("/v1/portal-attributes");
  return res.data;
}


export function usePortals() {
  return useQuery({
    queryKey: ["portals"],
    queryFn: fetchPortals,
    staleTime: 5 * 60_000,
    placeholderData: FALLBACK_PORTALS,
    retry: 1,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    staleTime: 5 * 60_000,
    placeholderData: FALLBACK_ROLES,
    retry: 1,
  });
}

export function usePortalAttributes() {
  return useQuery({
    queryKey: ["portal-attributes"],
    queryFn: fetchPortalAttributes,
    staleTime: 5 * 60_000,
    placeholderData: [],
    retry: 1,
  });
}

export function groupAttributes(defs: PortalAttributeDef[]) {
  const map: Record<number, Record<string, string[]>> = {};
  for (const d of defs) {
    map[d.portal_id] ??= {};
    map[d.portal_id][d.attr_key] ??= [];
    map[d.portal_id][d.attr_key].push(d.attr_value);
  }
  return map;
}
