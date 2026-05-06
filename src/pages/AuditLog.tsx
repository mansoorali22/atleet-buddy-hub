import { useState } from "react";
import { format, parseISO } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { canViewAllAuditEntries } from "@/lib/permissions";
import type { AuditEvent } from "@/types/audit";

function formatTs(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy HH:mm");
  } catch {
    return iso;
  }
}

function detailsText(details: Record<string, unknown> | null): string {
  if (!details) return "—";
  try {
    return JSON.stringify(details);
  } catch {
    return "—";
  }
}

const actionTone: Record<string, string> = {
  PLAN_CHANGE: "bg-accent text-accent-foreground",
  STATUS_CHANGE: "bg-secondary text-muted-foreground",
  BLOCK: "bg-destructive/10 text-destructive",
  UNBLOCK: "bg-accent text-accent-foreground",
  SEND_MESSAGE: "bg-secondary text-muted-foreground",
  DATES_CHANGE: "bg-secondary text-muted-foreground",
  LOGIN: "bg-secondary text-muted-foreground",
  PASSWORD_CHANGE: "bg-orange-500/10 text-orange-600",
  CREATE_SUPPORT_ACCOUNT: "bg-accent text-accent-foreground",
};

export default function AuditLogPage() {
  const { user } = useAuth();
  const isAdmin = canViewAllAuditEntries(user?.role);
  const [page, setPage] = useState(1);
  const perPage = 50;

  const listParams = {
    ...(user && !isAdmin ? { actor_email: user.email } : {}),
    page,
    per_page: perPage,
  };

  const { data, isLoading, isError, error } = useAuditLog(listParams);
  const events = data?.events ?? [];
  const totalPages = data?.pages ?? 1;

  const csvUrl = (() => {
    const base = import.meta.env.VITE_API_URL;
    if (!base) return null;
    return `${base}/audit/export`;
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Audit Log</h1>
            {!isAdmin && (
              <p className="mt-1 text-sm text-muted-foreground">
                Support accounts see actions tied to their own login.
              </p>
            )}
          </div>
          {csvUrl && isAdmin && (
            <a href={csvUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Export CSV
              </Button>
            </a>
          )}
        </div>

        {isError && (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load audit log."}
          </p>
        )}

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left bg-muted/30">
                <th className="px-4 py-3 font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Actor</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Target</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-full max-w-md" /></td>
                  </tr>
                ))}
              {!isLoading &&
                !isError &&
                events.map((l: AuditEvent) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatTs(l.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{l.actor_email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={`${actionTone[l.action] ?? "bg-secondary text-muted-foreground"} text-xs font-semibold`}
                      >
                        {l.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">
                      {l.target_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-md truncate" title={detailsText(l.details)}>
                      {detailsText(l.details)}
                    </td>
                  </tr>
                ))}
              {!isLoading && !isError && events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    No audit events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({data?.total ?? 0} events)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
