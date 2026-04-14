import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const users = [
  { id: 1, user: "+91 98765 43210", status: "active", plan: "monthly", start: "2025-01-15", end: "2025-02-15", msgs: 342 },
  { id: 2, user: "john@email.com", status: "active", plan: "yearly", start: "2024-06-01", end: "2025-06-01", msgs: 1204 },
  { id: 3, user: "+91 91234 56789", status: "inactive", plan: "quarterly", start: "2024-10-01", end: "2025-01-01", msgs: 56 },
  { id: 4, user: "priya@email.com", status: "blocked", plan: "monthly", start: "2025-03-01", end: "2025-04-01", msgs: 0 },
  { id: 5, user: "+91 99887 76655", status: "active", plan: "monthly", start: "2025-03-10", end: "2025-04-10", msgs: 189 },
  { id: 6, user: "arjun@email.com", status: "active", plan: "quarterly", start: "2025-01-01", end: "2025-04-01", msgs: 876 },
];

const statusColor: Record<string, string> = {
  active: "bg-accent text-accent-foreground",
  inactive: "bg-secondary text-muted-foreground",
  blocked: "bg-destructive/10 text-destructive",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const filtered = users.filter((u) => {
    if (search && !u.user.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (planFilter !== "all" && u.plan !== planFilter) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold text-foreground tracking-tight">User Management</h1>
          <span className="text-sm text-muted-foreground">{filtered.length} users</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left bg-muted/30">
                <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">User</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Plan</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Start</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">End</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Messages</th>
                <th className="px-5 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground">{u.user}</td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary" className={`${statusColor[u.status]} capitalize text-xs font-semibold`}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 capitalize text-foreground font-medium">{u.plan}</td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{u.start}</td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{u.end}</td>
                  <td className="px-5 py-4 text-foreground font-semibold">{u.msgs.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-md p-2 hover:bg-secondary transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="font-medium">Edit Plan</DropdownMenuItem>
                        <DropdownMenuItem className="font-medium">Edit Status</DropdownMenuItem>
                        <DropdownMenuItem className="font-medium">Edit Dates</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive font-medium">
                          {u.status === "blocked" ? "Unblock" : "Block"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
