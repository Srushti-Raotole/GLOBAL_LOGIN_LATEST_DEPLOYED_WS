import type { RoleRef } from "./types";

export function isAdminRole(role: RoleRef): boolean {
  return role.role_key.toUpperCase().includes("ADMIN");
}

export interface RoleBucket {
  /** The role's region, or "General" for roles that aren't tied to a region. */
  region: string;
  /** General-bucket roles aren't gated behind a region checkbox — they always show. */
  isGated: boolean;
  /** Admin role(s) for this bucket first, then the rest. */
  roles: RoleRef[];
}

// INDIA always shows above APAC; any other named region falls back to
// alphabetical order, and roles with no region ("General") show last.
const REGION_PRIORITY = ["INDIA", "APAC"];

// Splits a portal's roles into per-region buckets (plus a "General" bucket for
// roles with no region), admin role(s) sorted first within each bucket. A
// region's admin only implies full access within its own region/bucket, so
// keeping regions separate lets one region's admin selection leave the other
// region's picks untouched. Buckets are kept and rendered separately (never
// flattened together) so INDIA and APAC roles never visually merge into one list.
export function bucketRolesByRegion(roles: RoleRef[]): RoleBucket[] {
  const map: Record<string, RoleRef[]> = {};
  for (const role of roles) {
    const region = role.region || "General";
    (map[region] ??= []).push(role);
  }

  const namedRegions = Object.keys(map).filter((r) => r !== "General");
  const prioritized = REGION_PRIORITY.filter((p) => namedRegions.includes(p));
  const rest = namedRegions.filter((r) => !REGION_PRIORITY.includes(r.toUpperCase())).sort();
  const order = [...prioritized, ...rest, ...(map["General"] ? ["General"] : [])];

  return order.map((region) => {
    const bucketRoles = map[region];
    const admins = bucketRoles.filter(isAdminRole);
    const others = bucketRoles.filter((r) => !isAdminRole(r));
    return { region, isGated: region !== "General", roles: [...admins, ...others] };
  });
}

// At submit time, if a bucket (region) has an admin role selected, only that
// admin role id is kept for the bucket — the admin already implies full
// access to everything else in it.
export function cleanRoleIdsForPortal(selectedRoles: RoleRef[]): number[] {
  const byBucket: Record<string, RoleRef[]> = {};
  for (const role of selectedRoles) {
    const key = role.region || "General";
    (byBucket[key] ??= []).push(role);
  }

  const cleaned: number[] = [];
  for (const bucketRoles of Object.values(byBucket)) {
    const admins = bucketRoles.filter(isAdminRole);
    cleaned.push(...(admins.length > 0 ? admins : bucketRoles).map((r) => r.id));
  }
  return cleaned;
}
