import { useMemo, useState } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  getPaginationRowModel, flexRender, createColumnHelper,
  type SortingState, type PaginationState,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Search, ChevronLeft, ChevronRight, Edit, Trash2, ToggleLeft, ToggleRight, Eye } from "lucide-react";
import type { UserRow } from "../types";
import { ORGANIZATIONS, PORTALS, ROLES } from "../types";
import vegaLogo from "@/assets/vega-logo.png";
import lightstormLogo from "@/assets/lightstorm-logo.png";

const ORG_LOGOS: Record<string, string> = {
  Vegayan: vegaLogo,
  Lightstorm: lightstormLogo,
};

const col = createColumnHelper<UserRow>();

interface Props {
  users: UserRow[];
  loading: boolean;
  onEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
}

/** Count total roles across all portals */
function countRoles(portalRoles?: Record<string, string[]>): number {
  if (!portalRoles) return 0;
  return Object.values(portalRoles).reduce((sum, roles) => sum + roles.length, 0);
}

/** Compact roles display with popover for details */
function RolesCell({ portalRoles }: { portalRoles?: Record<string, string[]> }) {
  const roleCount = countRoles(portalRoles);

  if (roleCount === 0) {
    return <span className="text-muted-foreground italic text-[10px]">No roles</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-5 px-1.5 gap-1 text-[10px] font-normal hover:bg-accent/50 transition-colors">
          <Eye className="h-3 w-3" />
          <span>{roleCount} role{roleCount > 1 ? "s" : ""}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground border-b pb-1">Assigned Roles</p>
          {Object.entries(portalRoles!).map(([portalKey, roles]) => {
            const portal = PORTALS.find((p) => p.portal_key === portalKey);
            return (
              <div key={portalKey} className="space-y-0.5">
                <p className="text-[10px] font-medium text-primary">{portal?.portal_name || portalKey}</p>
                <div className="flex flex-wrap gap-1">
                  {roles.map((roleKey) => {
                    const role = ROLES.find((r) => r.role_key === roleKey);
                    return (
                      <Badge key={roleKey} variant="secondary" className="text-[9px] px-1.5 py-0">
                        {role?.role_name || roleKey}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function UserTable({ users, loading, onEdit, onDelete, onToggleStatus }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 });

  const filteredData = useMemo(() => {
    return users.filter((u) => {
      if (globalFilter) {
        const s = globalFilter.toLowerCase();
        if (!u.username.toLowerCase().includes(s) && !(u.email || "").toLowerCase().includes(s)) return false;
      }
      if (orgFilter !== "all" && u.organization !== orgFilter) return false;
      if (statusFilter !== "all") {
        const isEnabled = !!u.enabled;
        if (statusFilter === "ACTIVE" && !isEnabled) return false;
        if (statusFilter === "INACTIVE" && isEnabled) return false;
      }
      if (authFilter !== "all" && u.auth_type !== authFilter) return false;
      return true;
    });
  }, [users, globalFilter, orgFilter, statusFilter, authFilter]);

  const columns = useMemo(() => [
    col.accessor("username", { header: "Username", size: 180 }),
    col.accessor("email", {
      header: "Email", size: 180,
      cell: (info) => info.getValue() || <span className="text-muted-foreground italic">—</span>,
    }),
    col.accessor("auth_type", {
      header: "Auth", size: 60,
      cell: (info) => (
        <Badge variant={info.getValue() === "SSO" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
          {info.getValue()}
        </Badge>
      ),
    }),
    col.accessor("organization", {
      header: "Org", size: 90,
      cell: (info) => {
        const org = info.getValue();
        const logo = org ? ORG_LOGOS[org] : null;
        return logo ? (
          <img src={logo} alt={org!} className="h-5 w-auto max-w-[70px] object-contain" title={org!} />
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    }),
    col.display({
      id: "roles",
      header: "Roles",
      size: 100,
      cell: ({ row }) => <RolesCell portalRoles={row.original.portalRoles} />,
    }),
    col.accessor("is_active", {
      header: "Status", size: 70,
      cell: (info) => (
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 border ${
            info.getValue()
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-muted/50 text-muted-foreground border-border"
          }`}
        >
          {info.getValue() ? "Online" : "Offline"}
        </Badge>
      ),
    }),
    col.accessor("enabled", {
      header: "Access", size: 85,
      cell: (info) => (
        <Badge
          variant={info.getValue() ? "default" : "destructive"}
          className={`text-[10px] px-1.5 py-0 ${info.getValue() ? "bg-emerald-600" : ""}`}
        >
          {info.getValue() ? "Active" : "Deactivated"}
        </Badge>
      ),
    }),
    col.accessor("last_login_time", {
      header: "Last Login", size: 140,
      cell: (info) => {
        const v = info.getValue();
        return v ? <span className="text-xs">{new Date(v).toLocaleString()}</span> : <span className="text-muted-foreground italic text-xs">Never</span>;
      },
    }),
    col.display({
      id: "actions",
      header: "Actions",
      size: 140,
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent/50 transition-colors" onClick={() => onEdit(row.original)} title="Edit">
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent/50 transition-colors" onClick={() => onToggleStatus(row.original)} title={row.original.enabled ? "Deactivate" : "Activate"}>
            {row.original.enabled ? <ToggleRight className="h-3 w-3 text-emerald-500" /> : <ToggleLeft className="h-3 w-3 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/20 transition-colors text-destructive" onClick={() => onDelete(row.original)} title="Delete">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    }),
  ], [onEdit, onDelete, onToggleStatus]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => String(row.id),
  });

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 px-3 py-2 border-b bg-background shrink-0">
        <div className="relative w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search username" value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)} className="pl-8 h-7 text-xs" />
        </div>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue placeholder="Org" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orgs</SelectItem>
            {ORGANIZATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={authFilter} onValueChange={setAuthFilter}>
          <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue placeholder="Auth" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Auth</SelectItem>
            <SelectItem value="LOCAL">Local</SelectItem>
            <SelectItem value="SSO">SSO</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-20 shadow-sm">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/50 hover:bg-muted/50">
                {hg.headers.map((h) => (
                  <TableHead key={h.id} style={{ width: h.getSize() }}
                    className="font-semibold bg-muted/50 cursor-pointer select-none text-xs h-8 py-1"
                    onClick={h.column.getToggleSortingHandler()}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground text-xs">Loading users...</TableCell></TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-8">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1 text-xs">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-20 text-center text-xs">No users found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t shrink-0">
        <span className="text-xs text-muted-foreground">
          {filteredData.length} user(s) • Page {pagination.pageIndex + 1}/{table.getPageCount() || 1}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-6 w-6" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-6 w-6" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
