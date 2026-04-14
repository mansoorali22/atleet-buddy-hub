import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const aggregateStats = [
  { label: "Total Messages", value: "124,580" },
  { label: "Total Tokens", value: "48.2M" },
  { label: "Total Spend", value: "$612.40" },
];

const perUserUsage = [
  { user: "+91 98765 43210", msgs: 342, inputTokens: 85_000, outputTokens: 52_000, cost: "$1.68" },
  { user: "john@email.com", msgs: 1204, inputTokens: 301_000, outputTokens: 184_000, cost: "$5.93" },
  { user: "+91 91234 56789", msgs: 56, inputTokens: 14_000, outputTokens: 8_600, cost: "$0.28" },
  { user: "priya@email.com", msgs: 0, inputTokens: 0, outputTokens: 0, cost: "$0.00" },
  { user: "+91 99887 76655", msgs: 189, inputTokens: 47_250, outputTokens: 29_000, cost: "$0.93" },
  { user: "arjun@email.com", msgs: 876, inputTokens: 219_000, outputTokens: 134_000, cost: "$4.32" },
];

const dailyCost = [
  { day: "Mon", cost: 38 },
  { day: "Tue", cost: 44 },
  { day: "Wed", cost: 41 },
  { day: "Thu", cost: 52 },
  { day: "Fri", cost: 48 },
  { day: "Sat", cost: 29 },
  { day: "Sun", cost: 25 },
];
const maxCost = Math.max(...dailyCost.map((d) => d.cost));

const dailyMsgs = [
  { day: "Mon", msgs: 6200 },
  { day: "Tue", msgs: 7100 },
  { day: "Wed", msgs: 6800 },
  { day: "Thu", msgs: 8400 },
  { day: "Fri", msgs: 9100 },
  { day: "Sat", msgs: 5200 },
  { day: "Sun", msgs: 4800 },
];
const maxMsgs = Math.max(...dailyMsgs.map((d) => d.msgs));

export default function UsageCostPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Usage & Cost Analytics</h1>

        {/* Aggregate */}
        <div className="grid gap-4 sm:grid-cols-3">
          {aggregateStats.map((s) => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-5 space-y-1">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-heading font-semibold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-body font-medium text-foreground">Daily Usage</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-end gap-3 h-40">
                {dailyMsgs.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-7 rounded-t-md bg-primary/70" style={{ height: `${(d.msgs / maxMsgs) * 120}px` }} />
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-body font-medium text-foreground">Cost Trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-end gap-3 h-40">
                {dailyCost.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-7 rounded-t-md bg-primary/50" style={{ height: `${(d.cost / maxCost) * 120}px` }} />
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Per-user table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-body font-medium text-foreground">Per-User Usage</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Messages</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Input Tokens</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Output Tokens</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {perUserUsage.map((u) => (
                    <tr key={u.user} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{u.user}</td>
                      <td className="px-4 py-3 text-foreground">{u.msgs.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.inputTokens.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.outputTokens.toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{u.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
