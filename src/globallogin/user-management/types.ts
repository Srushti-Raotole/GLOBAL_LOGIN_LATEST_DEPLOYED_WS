export interface UserRow {
  id: number;
  username: string;
  email: string | null;
  auth_type: "LOCAL" | "SSO";
  enabled: boolean | number; 
  is_active: boolean | number; 
  organization: string | null;
  last_login_time: string | null;
  created_at: string;
  portalRoles?: Record<string, string[]>;
}

export interface UserDetail extends UserRow {
  portalAccess: string[];              
  portalRoles: Record<string, string[]>; 
  portalAttributes?: Record<string, Record<string, string[]>>; 
}


export type PortalAttributes = Record<string, Record<string, string[]>>;

export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string;       
  authType: "LOCAL" | "SSO";
  organization: string;
  enabled: boolean;
  roleIds: number[];
  portalIds: number[];
  portalAttributes?: PortalAttributes;
}

export interface UpdateUserPayload {
  email: string;
  organization: string;
  enabled: boolean;
  roleIds: number[];
  portalIds: number[];
  portalAttributes?: PortalAttributes;
}

export interface BulkImportResponse {
  successCount: number;
  errorCount: number;
  errors: string[];
}


export interface PortalRef {
  id: number;
  portal_key: string;
  portal_name: string;
}

export interface RoleRef {
  id: number;
  role_key: string;
  role_name: string;
  portal_id: number;
  region?: string | null; 
}
export const PORTALS: PortalRef[] = [
  { id: 1, portal_key: "INDIA_OSS",  portal_name: "India OSS Portal" },
  { id: 2, portal_key: "IP",         portal_name: "IP Portal" },
  { id: 3, portal_key: "SOM",        portal_name: "Service Order Management" },
  { id: 4, portal_key: "GLOBAL",     portal_name: "Global User Management" },
  { id: 5, portal_key: "APAC_OSS",   portal_name: "APAC OSS Portal" },
];

export const ROLES: RoleRef[] = [
  { id: 1,  role_key: "INDIA_NOC",              role_name: "India NOC Role",            portal_id: 1 },
  { id: 9,  role_key: "INDIA_ADMIN",            role_name: "India Admin Role",          portal_id: 1 },
  { id: 2,  role_key: "IP_NOC",                 role_name: "IP NOC Role",               portal_id: 2 },
  { id: 13, role_key: "ipnms",                  role_name: "IPNMS Role",                portal_id: 2 },
  { id: 14, role_key: "ipnms_admin",            role_name: "IPNMS Admin Role",          portal_id: 2 },
  { id: 4,  role_key: "GLOBAL_ADMIN",           role_name: "Global Admin Role",         portal_id: 4 },
  { id: 11, role_key: "APAC_NOC",               role_name: "APAC NOC Role",             portal_id: 5 },
  { id: 12, role_key: "APAC_ADMIN",             role_name: "APAC Admin Role",           portal_id: 5 },
  { id: 15, role_key: "ADMIN",                  role_name: "ADMIN",                     portal_id: 3 },
  { id: 16, role_key: "networkimplementation",  role_name: "Network Implementation",    portal_id: 3 },
  { id: 17, role_key: "CSD",                    role_name: "Customer Service Delivery", portal_id: 3 },
  { id: 18, role_key: "noc",                    role_name: "Network Operations Center", portal_id: 3 },
  { id: 19, role_key: "demouser",               role_name: "Demo User",                 portal_id: 3 },
  { id: 20, role_key: "feasibilitycheck",       role_name: "Feasibility Check",         portal_id: 3 },
  { id: 21, role_key: "networkplanning",        role_name: "Network Planning",          portal_id: 3 },
  { id: 22, role_key: "networkplanningtesting", role_name: "Network Planning (Testing)",portal_id: 3 },
  { id: 23, role_key: "SOC",                    role_name: "Security Operations Center",portal_id: 3 },
];

export const ORGANIZATIONS = ["Lightstorm", "Vegayan"] as const;
