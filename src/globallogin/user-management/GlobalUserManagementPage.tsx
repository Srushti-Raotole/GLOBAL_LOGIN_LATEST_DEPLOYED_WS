import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Upload,
  Download,
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  LogOut,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import vegaLogo from "@/assets/vega-logo.png";
import { UserTable } from "./components/UserTable";
import { AddUserDialog } from "./components/AddUserDialog";
import { EditUserDialog } from "./components/EditUserDialog";
import { DeleteUserDialog } from "./components/DeleteUserDialog";
import { BulkImportDialog } from "./components/BulkImportDialog";
import {
  fetchAllUsersFull,
  fetchUserById,
  createUser,
  updateUser,
  deleteUser as deleteUserApi,
  toggleUserStatus,
  bulkImportUsers,
} from "./api";
import { PORTALS } from "./types";
import type {
  UserRow,
  UserDetail,
  CreateUserPayload,
  UpdateUserPayload,
} from "./types";

/** Map portal_key to the gradient colors matching PortalSelectionPage */
const PORTAL_COLORS: Record<string, { active: string; base: string }> = {
  INDIA_OSS: {
    active:
      "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-500",
    base: "border-orange-500/40 text-orange-400 hover:bg-orange-500/10",
  },
  IP: {
    active:
      "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-blue-500",
    base: "border-blue-500/40 text-blue-400 hover:bg-blue-500/10",
  },
  SOM: {
    active:
      "bg-gradient-to-r from-violet-500 to-purple-600 text-white border-violet-500",
    base: "border-violet-500/40 text-violet-400 hover:bg-violet-500/10",
  },
  GLOBAL: {
    active:
      "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500",
    base: "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10",
  },
  APAC_OSS: {
    active:
      "bg-gradient-to-r from-rose-500 to-pink-600 text-white border-rose-500",
    base: "border-rose-500/40 text-rose-400 hover:bg-rose-500/10",
  },
};

export default function GlobalUserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalFilter, setPortalFilter] = useState<string>("ALL");

  // Dialog states
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<UserDetail | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllUsersFull();
      setUsers(data);
    } catch (err: any) {
      toast.error(
        "Failed to load users: " + (err?.response?.data || err.message),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Portal-filtered users
  const filteredUsers = useMemo(() => {
    if (portalFilter === "ALL") return users;
    return users.filter((u) => {
      const roles = u.portalRoles;
      if (!roles) return false;
      return !!roles[portalFilter];
    });
  }, [users, portalFilter]);

  // Stats
  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter((u) => !!u.enabled).length;
  const deactivatedUsers = totalUsers - activeUsers;
  const onlineUsers = filteredUsers.filter((u) => !!u.is_active).length;

  // Handlers
  const handleAdd = async (payload: CreateUserPayload) => {
    try {
      await createUser(payload);
      toast.success(`User "${payload.username}" created successfully`);
      loadUsers();
    } catch (err: any) {
      toast.error(
        "Failed to create user: " + (err?.response?.data || err.message),
      );
      throw err;
    }
  };

  const handleEditClick = async (user: UserRow) => {
    try {
      const detail = await fetchUserById(user.id);
      setSelectedUserDetail(detail);
      setShowEdit(true);
    } catch (err: any) {
      toast.error(
        "Failed to load user details: " + (err?.response?.data || err.message),
      );
    }
  };

  const handleSave = async (id: number, payload: UpdateUserPayload) => {
    try {
      await updateUser(id, payload);
      toast.success("User updated successfully");
      loadUsers();
    } catch (err: any) {
      toast.error(
        "Failed to update user: " + (err?.response?.data || err.message),
      );
      throw err;
    }
  };

  const handleDeleteClick = (user: UserRow) => {
    setSelectedUser(user);
    setShowDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUserApi(selectedUser.id);
      toast.success(`User "${selectedUser.username}" deleted`);
      setShowDelete(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error(
        "Failed to delete user: " + (err?.response?.data || err.message),
      );
    }
  };

  const handleToggleStatus = async (user: UserRow) => {
    try {
      await toggleUserStatus(user.id);
      toast.success(
        `User "${user.username}" ${user.enabled ? "deactivated" : "activated"}`,
      );
      loadUsers();
    } catch (err: any) {
      toast.error(
        "Failed to toggle status: " + (err?.response?.data || err.message),
      );
    }
  };

  const handleBulkImport = async (file: File) => {
    try {
      const res = await bulkImportUsers(file);
      toast.success(`Imported ${res.successCount} user(s)`);
      loadUsers();
      return res;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Bulk import failed";
      toast.error(`Bulk import failed: ${errorMessage}`);
      throw err;
    }
  };

  const handleExport = () => {
    const csv = [
      [
        "id",
        "username",
        "email",
        "auth_type",
        "enabled",
        "is_active",
        "organization",
        "last_login_time",
        "created_at",
      ].join(","),
      ...filteredUsers.map((u) =>
        [
          u.id,
          u.username,
          u.email || "",
          u.auth_type,
          u.enabled ? 1 : 0,
          u.is_active ? 1 : 0,
          u.organization || "",
          u.last_login_time || "",
          u.created_at,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported");
  };

  const handleGlobalLogout = () => {
    // Security Issue Fix - Clear from sessionStorage instead of localStorage.
    sessionStorage.removeItem("LS_AUTH_TOKEN");
    sessionStorage.removeItem("LS_AUTH_USER");
    window.location.href = "/globallogintest/login";
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src={vegaLogo} alt="Vega" className="h-7 w-auto" />
            <div className="h-5 w-px bg-border" />
            <h1 className="text-sm font-semibold">Global User Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/portals")}
              className="gap-1.5 h-7 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Portals
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleGlobalLogout}
              className="gap-1.5 h-7 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden px-4 pt-3 gap-3">
        {/* Stats — compact 4-column */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Total Users
              </p>
              <p className="text-base font-bold leading-none">
                {loading ? "—" : totalUsers}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
            <UserCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Active
              </p>
              <p className="text-base font-bold leading-none">
                {loading ? "—" : activeUsers}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
            <UserX className="h-3.5 w-3.5 text-destructive shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Deactivated
              </p>
              <p className="text-base font-bold leading-none">
                {loading ? "—" : deactivatedUsers}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
            <Wifi className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Online Now
              </p>
              <p className="text-base font-bold leading-none">
                {loading ? "—" : onlineUsers}
              </p>
            </div>
          </div>
        </div>

        {/* Action bar with portal tabs on left */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Button
              variant={portalFilter === "ALL" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => setPortalFilter("ALL")}
            >
              All Portals
            </Button>
            {PORTALS.map((p) => {
              const colors = PORTAL_COLORS[p.portal_key];
              const isActive = portalFilter === p.portal_key;
              return (
                <Button
                  key={p.portal_key}
                  variant="outline"
                  size="sm"
                  className={`h-7 text-xs shrink-0 transition-all ${
                    isActive && colors
                      ? colors.active
                      : colors
                        ? colors.base
                        : ""
                  }`}
                  onClick={() => setPortalFilter(p.portal_key)}
                >
                  {p.portal_name}
                </Button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setShowAdd(true)}
              className="gap-1.5 h-7 text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add User
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImport(true)}
              className="gap-1.5 h-7 text-xs"
            >
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 h-7 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden border rounded-lg min-h-0">
          <UserTable
            users={filteredUsers}
            loading={loading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </main>

      {/* Dialogs */}
      <AddUserDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onAdd={handleAdd}
      />
      <EditUserDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        user={selectedUserDetail}
        onSave={handleSave}
      />
      <DeleteUserDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        user={selectedUser}
        onConfirm={handleConfirmDelete}
      />
      <BulkImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImport={handleBulkImport}
      />
    </div>
  );
}
