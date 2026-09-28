      
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { ORGANIZATIONS, type CreateUserPayload, type PortalAttributes, type RoleRef } from "../types";
import { usePortals, useRoles, usePortalAttributes, groupAttributes } from "../hooks";
import { isAdminRole, bucketRolesByRegion, cleanRoleIdsForPortal } from "../roleUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (payload: CreateUserPayload) => Promise<void>;
}

export function AddUserDialog({ open, onOpenChange, onAdd }: Props) {
  const { data: portals = [] } = usePortals();
  const { data: roles = [] } = useRoles();
  const { data: attrDefs = [] } = usePortalAttributes();
  const attrMap = groupAttributes(attrDefs);

  const [form, setForm] = useState<CreateUserPayload>({
    username: "", email: "", password: "", authType: "LOCAL",
    organization: ORGANIZATIONS[0] || "", enabled: true, roleIds: [], portalIds: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [portalRoleMap, setPortalRoleMap] = useState<Record<number, number[]>>({});
  const [portalAttrs, setPortalAttrs] = useState<PortalAttributes>({});

  const reset = () => {
    setForm({ username: "", email: "", password: "", authType: "LOCAL", organization: ORGANIZATIONS[0] || "", enabled: true, roleIds: [], portalIds: [] });
    setPortalRoleMap({});
    setPortalAttrs({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organization) return;
    setSubmitting(true);
    try {
      const selectedPortals = portals.filter((p) => form.portalIds.includes(p.id));
      const cleanedRoleIds: number[] = [];

      for (const portal of selectedPortals) {
        const pRoles = portalRoleMap[portal.id] || [];
        const pRoleObjs = pRoles.map((id) => roles.find((r) => r.id === id)).filter(Boolean) as RoleRef[];
        cleanedRoleIds.push(...cleanRoleIdsForPortal(pRoleObjs));
      }

      await onAdd({ ...form, roleIds: cleanedRoleIds, portalAttributes: portalAttrs });
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePortal = (id: number, portalKey: string) => {
    const has = form.portalIds.includes(id);
    setForm((f) => ({ ...f, portalIds: has ? f.portalIds.filter((p) => p !== id) : [...f.portalIds, id] }));
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

  const selectedPortals = portals.filter((p) => form.portalIds.includes(p.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="h-8 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Auth Type</Label>
              <div className="flex p-1 bg-muted rounded-md w-full">
                <button type="button" onClick={() => setForm({ ...form, authType: "LOCAL" })} className={`flex-1 text-xs py-1 font-medium rounded-sm transition-all ${form.authType === "LOCAL" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Local</button>
                <button type="button" onClick={() => setForm({ ...form, authType: "SSO" })} className={`flex-1 text-xs py-1 font-medium rounded-sm transition-all ${form.authType === "SSO" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>SSO</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Organization</Label>
              <div className="flex p-1 bg-muted rounded-md w-full">
                {ORGANIZATIONS.map((org) => (
                  <button key={org} type="button" onClick={() => setForm({ ...form, organization: org })} className={`flex-1 text-xs py-1 font-medium rounded-sm transition-all ${form.organization === org ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{org}</button>
                ))}
              </div>
            </div>
          </div>

          {form.authType === "LOCAL" && (
            <div className="space-y-1">
              <Label className="text-xs">Password</Label>
              <Input type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="h-8 text-sm" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Portal Access</Label>
            <div className="grid grid-cols-2 gap-2 p-2.5 border rounded-md bg-slate-50/50 dark:bg-slate-900/50">
              {portals.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`portal-${p.id}`}
                    checked={form.portalIds.includes(p.id)}
                    onCheckedChange={() => togglePortal(p.id, p.portal_key)}
                  />
                  <label htmlFor={`portal-${p.id}`} className="text-xs cursor-pointer select-none font-medium">{p.portal_name}</label>
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
                                  id={`attr-${portal.id}-${attrKey}-${v}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleRegionAttr(portal.portal_key, v)}
                                />
                                <label htmlFor={`attr-${portal.id}-${attrKey}-${v}`} className="text-xs cursor-pointer select-none">{v}</label>
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
                                  id={`role-${portal.id}-${r.id}`}
                                  checked={selected.includes(r.id)}
                                  disabled={disabled}
                                  onCheckedChange={() => toggleRoleForPortal(portal.id, r.id)}
                                />
                                <label
                                  htmlFor={`role-${portal.id}-${r.id}`}
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
              {submitting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Creating...</> : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}