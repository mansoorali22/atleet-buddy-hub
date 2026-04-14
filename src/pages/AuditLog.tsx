import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

const logs = [
  { ts: "2025-04-14 10:32", actor: "admin@atleet.com", action: "Plan Change", details: "Changed +91 98765 43210 from monthly → quarterly" },
  { ts: "2025-04-14 09:15", actor: "support@atleet.com", action: "Status View", details: "Viewed user john@email.com profile" },
  { ts: "2025-04-13 18:45", actor: "admin@atleet.com", action: "Block User", details: "Blocked priya@email.com — spam behavior" },
  { ts: "2025-04-13 14:20", actor: "admin@atleet.com", action: "Plan Change", details: "Changed arjun@email.com from monthly → yearly" },
  { ts: "2025-04-12 11:00", actor: "system", action: "Alert Triggered", details: "Spend spike detected — $52 daily (threshold $45)" },
  { ts: "2025-04-12 08:30", actor: "admin@atleet.com", action: "Unblock User", details: "Unblocked +91 91234 56789" },
];

const actionColor: Record<string, string> = {
  "Plan Change": "bg-accent text-accent-foreground",
  "Block User": "bg-destructive/10 text-destructive",
  "Unblock User": "bg-accent text-accent-foreground",
  "Alert Triggered": "bg-warning/10 text-warning",
  "Status View": "bg-secondary text-muted-foreground",
};

export default function AuditLogPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Audit Log</h1>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Actor</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{l.ts}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{l.actor}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={`${actionColor[l.action] || ""} text-xs`}>
                      {l.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
