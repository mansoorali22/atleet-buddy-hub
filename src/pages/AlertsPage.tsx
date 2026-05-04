import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, TrendingUp, UserX } from "lucide-react";

const alerts = [
  {
    title: "Spend Spike Detected",
    description: "Daily spend reached $52, exceeding the $45 threshold. Review usage patterns.",
    timestamp: "2025-04-12 11:00",
    status: "active" as const,
    icon: TrendingUp,
  },
  {
    title: "User Hitting Message Limits",
    description: "+91 98765 43210 sent 340+ messages this billing cycle, approaching the 500 cap.",
    timestamp: "2025-04-13 08:20",
    status: "active" as const,
    icon: AlertTriangle,
  },
  {
    title: "High Refusal Rate",
    description: "Refusal rate increased to 12% over the past 24 hours. Review topic: Supplements.",
    timestamp: "2025-04-13 16:45",
    status: "active" as const,
    icon: AlertTriangle,
  },
  {
    title: "Blocked User Activity Attempt",
    description: "priya@email.com attempted to send messages while blocked.",
    timestamp: "2025-04-14 07:10",
    status: "resolved" as const,
    icon: UserX,
  },
];

export default function AlertsPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user?.role}</span> — admins and support can
            view alerts; alert configuration (roadmap B6) is admin-only.
          </p>
        </div>

        <div className="space-y-3">
          {alerts.map((a, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <div
                  className={`mt-0.5 rounded-lg p-2.5 ${
                    a.status === "active" ? "bg-destructive/10" : "bg-secondary"
                  }`}
                >
                  <a.icon
                    className={`h-5 w-5 ${
                      a.status === "active" ? "text-destructive" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{a.title}</h3>
                    <Badge
                      variant="secondary"
                      className={`text-xs capitalize ${
                        a.status === "active"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {a.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  <p className="text-xs text-muted-foreground">{a.timestamp}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
