import { useState } from "react";
import { format, parseISO } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Bell, ShieldAlert, CheckCircle2, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { useAlerts, useAlertStats, useAcknowledgeAlert, useResolveAlert, useReopenAlert } from "@/hooks/useAlerts";
import type { Alert } from "@/types/alert";

const severityIcon = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Bell,
};

const severityBg = {
  critical: "bg-destructive/10",
  warning: "bg-orange-500/10",
  info: "bg-secondary",
};

const severityText = {
  critical: "text-destructive",
  warning: "text-orange-600",
  info: "text-muted-foreground",
};

function formatTs(iso: string | null): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "MMM d, yyyy HH:mm");
  } catch {
    return iso;
  }
}

function formatDetails(details: Record<string, unknown> | null): { label: string; value: string }[] {
  if (!details) return [];
  const readable: { label: string; value: string }[] = [];
  for (const [key, val] of Object.entries(details)) {
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    let value: string;
    if (typeof val === "number") {
      value = key.toLowerCase().includes("cost") || key.toLowerCase().includes("threshold") && typeof val === "number" && val < 100
        ? `$${val.toFixed(2)}`
        : key.toLowerCase().includes("rate")
        ? `${(val * 100).toFixed(1)}%`
        : val.toLocaleString();
    } else {
      value = String(val);
    }
    readable.push({ label, value });
  }
  return readable;
}

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data, isLoading, error } = useAlerts(statusFilter);
  const stats = useAlertStats();
  const ack = useAcknowledgeAlert();
  const resolve = useResolveAlert();
  const reopen = useReopenAlert();

  const alerts = data?.alerts ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Alerts</h1>
            {stats.data && (
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.data.total_active} active
                {stats.data.active_critical > 0 && (
                  <span className="text-destructive font-medium"> ({stats.data.active_critical} critical)</span>
                )}
              </p>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {(error as Error).message ?? "Could not load alerts."}
          </p>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        <div className="space-y-3">
          {alerts.map((a: Alert) => {
            const Icon = severityIcon[a.severity] ?? Bell;
            const isExpanded = expandedId === a.id;
            const details = formatDetails(a.details);

            return (
              <Card key={a.id} className="shadow-sm">
                <CardContent className="p-0">
                  {/* Main row — clickable to expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                    className="flex items-start gap-4 p-5 w-full text-left hover:bg-secondary/30 transition-colors rounded-xl"
                  >
                    <div className={`mt-0.5 rounded-lg p-2.5 ${severityBg[a.severity] ?? "bg-secondary"}`}>
                      <Icon className={`h-5 w-5 ${severityText[a.severity] ?? "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground">{a.title}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-xs capitalize ${
                            a.status === "active"
                              ? "bg-destructive/10 text-destructive"
                              : a.status === "acknowledged"
                              ? "bg-orange-500/10 text-orange-600"
                              : "bg-accent text-accent-foreground"
                          }`}
                        >
                          {a.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {a.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground">{formatTs(a.created_at)}</p>
                    </div>
                    <div className="shrink-0 mt-1 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Expanded details + actions */}
                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 space-y-4">
                      {/* Details */}
                      {details.length > 0 && (
                        <div className="rounded-lg bg-secondary/30 px-4 py-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Details</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                            {details.map((d) => (
                              <div key={d.label} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{d.label}</span>
                                <span className="font-medium text-foreground">{d.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {a.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => ack.mutate(a.id)}
                            disabled={ack.isPending}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {(a.status === "active" || a.status === "acknowledged") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolve.mutate(a.id)}
                            disabled={resolve.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Resolve
                          </Button>
                        )}
                        {(a.status === "acknowledged" || a.status === "resolved") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={() => reopen.mutate(a.id)}
                            disabled={reopen.isPending}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {!isLoading && alerts.length === 0 && (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No alerts match this filter.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
