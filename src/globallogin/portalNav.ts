// =============================================================================
// Portal Navigation — single source of truth for all portal switching logic.
//
// Every portal URL, every navigation decision, and every logout redirect lives
// here. If a portal URL changes or a new portal is added, this is the only
// file that needs to change.
// =============================================================================

import { Map, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getStoredToken } from "./api";

// ---------------------------------------------------------------------------
// Auth redirect URLs
// ---------------------------------------------------------------------------

/** Where to send the user after logout or on an unauthenticated 401. */
export const GLOBAL_LOGIN_PAGE = "/globallogintest/login";

// ---------------------------------------------------------------------------
// Portal definitions
// ---------------------------------------------------------------------------

export interface PortalDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  hoverColor: string;
  /** Full external URL for cross-app navigation. Undefined for internal-only portals. */
  externalUrl?: string;
  /** React Router path for portals rendered inside this app. */
  internalRoute?: string;
}

// Add or remove portals here — UI and navigation logic pick up the change automatically.
export const PORTALS: PortalDef[] = [
  {
    id: "india-noc",
    title: "INDIA OSS",
    description: "India Network Operations Center - Monitoring & Surveillance",
    icon: Map,
    bgColor: "bg-gradient-to-br from-orange-500 to-amber-600",
    hoverColor: "hover:from-orange-600 hover:to-amber-700",
    // externalUrl: "https://ngossprod.lightstorm.in/uitest/faults/active",  // production
    // externalUrl: "http://10.27.144.225:8082/uitest/faults/active",        // staging
    externalUrl: "http://10.27.144.225:8082/uitest/faults/active",
  },
  // Uncomment to re-enable portals:
  // {
  //   id: "ip",
  //   title: "IP",
  //   description: "IP Network Management & Infrastructure",
  //   icon: Network,
  //   bgColor: "bg-gradient-to-br from-blue-500 to-cyan-600",
  //   hoverColor: "hover:from-blue-600 hover:to-cyan-700",
  //   externalUrl: "https://ipossprod.lightstorm.in/ui/global-login",
  // },
  // {
  //   id: "som",
  //   title: "SOM",
  //   description: "Service Order Management - Order Lifecycle & Fulfillment",
  //   icon: ClipboardList,
  //   bgColor: "bg-gradient-to-br from-violet-500 to-purple-600",
  //   hoverColor: "hover:from-violet-600 hover:to-purple-700",
  //   externalUrl: "https://somossprod.lightstorm.in/som/global-login",
  // },
  // {
  //   id: "apac",
  //   title: "APAC OSS",
  //   description: "Asia Pacific Operations Support System",
  //   icon: Globe,
  //   bgColor: "bg-gradient-to-br from-rose-500 to-pink-600",
  //   hoverColor: "hover:from-rose-600 hover:to-pink-700",
  //   externalUrl: "https://apacdciossprod.lightstorm.net/ui/faults/active",
  // },
  {
    id: "global-users",
    title: "Global User Management",
    description: "Centralized User Administration & Access Control",
    icon: Users,
    bgColor: "bg-gradient-to-br from-emerald-500 to-teal-600",
    hoverColor: "hover:from-emerald-600 hover:to-teal-700",
    internalRoute: "/user-management",
  },
];

// ---------------------------------------------------------------------------
// URL-token strategy
// ---------------------------------------------------------------------------

// Portals that share the same origin as this Global Login app.
// sessionStorage persists across same-origin tab navigations, so the JWT
// is already available in the destination app — no ?token= needed.
const SAME_ORIGIN_PORTALS = new Set<string>([
  "india-noc",
  // Add any future same-origin portals here.
]);

/**
 * Build the final navigation URL for a portal.
 * - Same-origin portals → externalUrl as-is (sessionStorage carries the token).
 * - Different-origin portals → appends ?token=<jwt> so the destination can bootstrap its session.
 */
export function buildPortalUrl(portal: PortalDef): string {
  if (!portal.externalUrl) return "";
  if (SAME_ORIGIN_PORTALS.has(portal.id)) return portal.externalUrl;
  const token = getStoredToken();
  if (!token) return portal.externalUrl;
  const separator = portal.externalUrl.includes("?") ? "&" : "?";
  return `${portal.externalUrl}${separator}token=${encodeURIComponent(token)}`;
}

/**
 * Navigate to a portal.
 * - Internal portals (internalRoute) → React Router navigate.
 * - External portals → full page navigation to buildPortalUrl().
 */
export function navigateToPortal(
  portal: PortalDef,
  navigate: (path: string) => void
): void {
  if (portal.internalRoute) {
    navigate(portal.internalRoute);
    return;
  }
  const url = buildPortalUrl(portal);
  if (url) window.location.href = url;
}
