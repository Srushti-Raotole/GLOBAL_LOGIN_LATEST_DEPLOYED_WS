import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { ORGANIZATIONS, type UserDetail, type UpdateUserPayload, type PortalAttributes, type RoleRef } from "../types";
import { usePortals, useRoles, usePortalAttributes, groupAttributes } from "../hooks";
import { isAdminRole, bucketRolesByRegion, cleanRoleIdsForPortal } from "../roleUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDetail | null;
  onSave: (id: number, payload: UpdateUserPayload) => Promise<void>;
}

export function EditUserDialog({ open, onOpenChange, user, onSave }: Props) {
  const { data: portals = [] } = usePortals();
  const { data: roles = [] } = useRoles();
  const { data: attrDefs = [] } = usePortalAttributes();
  const attrMap = groupAttributes(attrDefs);

  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [portalIds, setPortalIds] = useState<number[]>([]);
  const [portalRoleMap, setPortalRoleMap] = useState<Record<number, number[]>>({});
  const [portalAttrs, setPortalAttrs] = useState<PortalAttributes>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || portals.length === 0) return;
    setEmail(user.email || "");
    setOrganization(user.organization || "");
    setEnabled(!!user.enabled);
    setPortalIds(portals.filter((p) => user.portalAccess.includes(p.portal_key)).map((p) => p.id));
    const map: Record<number, number[]> = {};
    for (const portal of portals) {
      const userRoles = user.portalRoles[portal.portal_key] || [];
      if (userRoles.length > 0) {
        const ids = roles.filter((r) => r.portal_id === portal.id && userRoles.includes(r.role_key)).map((r) => r.id);
        if (ids.length > 0) map[portal.id] = ids;
      }
    }
    setPortalRoleMap(map);

    const attrs: PortalAttributes = {};
    if (user.portalAttributes) {
        Object.entries(user.portalAttributes).forEach(([pKey, aMap]) => {
            attrs[pKey] = {};
            Object.entries(aMap).forEach(([aKey, vals]) => {
                attrs[pKey][aKey] = aKey.toLowerCase() === "region" ? [...vals] : (vals.length > 0 ? [vals[0]] : []);
            });
        });
    }

    // A region whose role(s) are already assigned shouldn't be hidden behind
    // an unchecked region checkbox — default it to checked.
    for (const portal of portals) {
      const selectedIds = map[portal.id] || [];
      const impliedRegions = selectedIds
        .map((id) => roles.find((r) => r.id === id)?.region)
        .filter((r): r is string => !!r);
      if (impliedRegions.length === 0) continue;
      const existing = attrs[portal.portal_key]?.["region"] || [];
      attrs[portal.portal_key] = {
        ...(attrs[portal.portal_key] || {}),
        region: Array.from(new Set([...existing, ...impliedRegions])),
      };
    }

    setPortalAttrs(attrs);
  }, [user, portals, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !organization) return;
    setSubmitting(true);
    try {
      const selectedPortals = portals.filter((p) => portalIds.includes(p.id));
      const cleanedRoleIds: number[] = [];

      for (const portal of selectedPortals) {
        const pRoles = portalRoleMap[portal.id] || [];
        const pRoleObjs = pRoles.map((id) => roles.find((r) => r.id === id)).filter(Boolean) as RoleRef[];
        cleanedRoleIds.push(...cleanRoleIdsForPortal(pRoleObjs));
      }

      await onSave(user.id, { email, organization, enabled, roleIds: cleanedRoleIds, portalIds, portalAttributes: portalAttrs });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePortal = (id: number, portalKey: string) => {
    const has = portalIds.includes(id);
    setPortalIds((prev) => has ? prev.filter((p) => p !== id) : [...prev, id]);
    if (has) {
      setPortalRoleMap((p) => { const n = { ...p }; delete n[id]; return n; });
      setPortalAttrs((p) => { const n = { ...p }; delete n[portalKey]; return n; });
    }
  };

  const toggleRegionAttr = (portalKey: string, value: string) => {
    setPortalAttrs((prev) => {
      const cur = prev[portalKey]?.["region"] || [];
      const has = cur.includes(value);
      return {
        ...prev,
        [portalKey]: { ...(prev[portalKey] || {}), region: has ? cur.filter((v) => v !== value) : [...cur, value] },
      };
    });
  };

  const toggleRoleForPortal = (portalId: number, roleId: number) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const bucketOf = (id: number) => roles.find((r) => r.id === id)?.region || "General";
    const bucket = role.region || "General";

    setPortalRoleMap((prev) => {
      const cur = prev[portalId] || [];
      const alreadySelected = cur.includes(roleId);

      // Selecting a region's admin role grants full access within that region
      // only — it replaces other selections in the same bucket, not the whole portal.
      if (!alreadySelected && isAdminRole(role)) {
        const rest = cur.filter((id) => bucketOf(id) !== bucket);
        return { ...prev, [portalId]: [...rest, roleId] };
      }

      const hasBucketAdminSelected = cur.some((id) => bucketOf(id) === bucket && roles.find((r) => r.id === id && isAdminRole(r)));
      if (!alreadySelected && hasBucketAdminSelected) return prev;

      return { ...prev, [portalId]: alreadySelected ? cur.filter((r) => r !== roleId) : [...cur, roleId] };
    });
  };

  const selectedPortals = portals.filter((p) => portalIds.includes(p.id));

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit User — {user.username}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Username</Label>
              <Input value={user.username} disabled className="bg-muted h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-8 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Auth Type</Label>
              <div className="flex p-1 bg-muted rounded-md w-full opacity-70 pointer-events-none">
                <button type="button" className={`flex-1 text-xs py-1 font-medium rounded-sm ${user.auth_type === "LOCAL" ? "bg-background shadow-sm" : ""}`}>Local</button>
                <button type="button" className={`flex-1 text-xs py-1 font-medium rounded-sm ${user.auth_type === "SSO" ? "bg-background shadow-sm" : ""}`}>SSO</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Organization</Label>
              <div className="flex p-1 bg-muted rounded-md w-full">
                {ORGANIZATIONS.map((org) => (
                  <button key={org} type="button" onClick={() => setOrganization(org)} className={`flex-1 text-xs py-1 font-medium rounded-sm transition-all ${organization === org ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{org}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 w-1/2 pr-2">
            <Label className="text-xs">Status</Label>
            <div className="flex p-1 bg-muted rounded-md w-full">
                <button type="button" onClick={() => setEnabled(true)} className={`flex-1 text-xs py-1 font-medium rounded-sm transition-all ${enabled ? "bg-background shadow-sm text-green-600 dark:text-green-400" : "text-muted-foreground hover:text-foreground"}`}>Enabled</button>
                <button type="button" onClick={() => setEnabled(false)} className={`flex-1 text-xs py-1 font-medium rounded-sm transition-all ${!enabled ? "bg-background shadow-sm text-red-600 dark:text-red-400" : "text-muted-foreground hover:text-foreground"}`}>Disabled</button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Portal Access</Label>
            <div className="grid grid-cols-2 gap-2 p-2.5 border rounded-md bg-slate-50/50 dark:bg-slate-900/50">
              {portals.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-portal-${p.id}`}
                    checked={portalIds.includes(p.id)}
                    onCheckedChange={() => togglePortal(p.id, p.portal_key)}
                  />
                  <label htmlFor={`edit-portal-${p.id}`} className="text-xs cursor-pointer select-none font-medium">{p.portal_name}</label>
                </div>
              ))}
            </div>
          </div>

          {selectedPortals.map((portal) => {
            const portalRoles = roles.filter((r) => r.portal_id === portal.id);
            const selected = portalRoleMap[portal.id] || [];
            const subAttrs = attrMap[portal.id] || {};
            const attrEntries = Object.entries(subAttrs);

            if (portalRoles.length === 0 && attrEntries.length === 0) return null;

            const buckets = bucketRolesByRegion(portalRoles);
            const selectedRegions = portalAttrs[portal.portal_key]?.["region"] || [];
            const visibleBuckets = buckets.filter((b) => !b.isGated || selectedRegions.includes(b.region));

            return (
              <div key={portal.id} className="space-y-3 border rounded-md p-3.5 shadow-sm">
                <Label className="text-sm font-semibold text-primary">{portal.portal_name}</Label>

                {attrEntries.map(([attrKey, values]) => {
                  const isRegion = attrKey.toLowerCase() === "region";
                  const currentVals = portalAttrs[portal.portal_key]?.[attrKey] || [];
                  return (
                    <div key={attrKey} className="space-y-1.5 flex flex-col pb-2 border-b">
                      <Label className="text-[11px] font-semibold text-muted-foreground capitalize">{attrKey}</Label>
                      <div className="flex gap-3 flex-wrap">
                        {values.map((v) => {
                          const isSelected = currentVals.includes(v);
                          if (isRegion) {
                            return (
                              <div key={v} className="flex items-center gap-2">
                                <Checkbox
                                  id={`edit-attr-${portal.id}-${attrKey}-${v}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleRegionAttr(portal.portal_key, v)}
                                />
                                <label htmlFor={`edit-attr-${portal.id}-${attrKey}-${v}`} className="text-xs cursor-pointer select-none">{v}</label>
                              </div>
                            );
                          }
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setPortalAttrs((prev) => ({
                                ...prev, [portal.portal_key]: { ...(prev[portal.portal_key] || {}), [attrKey]: [v] }
                              }))}
                              className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-all ${isSelected ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-transparent text-foreground border-input hover:bg-muted"}`}
                            >
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="space-y-3">
                  {visibleBuckets.map((bucket, idx) => {
                    const bucketAdminSelected = bucket.roles.some((r) => isAdminRole(r) && selected.includes(r.id));
                    return (
                      <div key={bucket.region}>
                        {idx > 0 && <div className="border-t border-dashed my-3" />}
                        {bucket.isGated && (
                          <Label className="text-[11px] font-bold text-muted-foreground mb-2 block">
                            {bucket.region} Roles
                          </Label>
                        )}
                        <div className="grid grid-cols-2 gap-2.5">
                          {bucket.roles.map((r) => {
                            const disabled = bucketAdminSelected && !isAdminRole(r);
                            return (
                              <div key={r.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`edit-role-${portal.id}-${r.id}`}
                                  checked={selected.includes(r.id)}
                                  disabled={disabled}
                                  onCheckedChange={() => toggleRoleForPortal(portal.id, r.id)}
                                />
                                <label
                                  htmlFor={`edit-role-${portal.id}-${r.id}`}
                                  className={`text-xs select-none ${disabled ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  {r.role_name}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
