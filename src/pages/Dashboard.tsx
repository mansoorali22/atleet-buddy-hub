import { Users, CreditCard, MessageSquare, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { title: "Total Users", value: "1,247", change: "+12%", up: true, icon: Users },
  { title: "Active Subscriptions", value: "983", change: "+5%", up: true, icon: CreditCard },
  { title: "Messages Today", value: "8,432", change: "+18%", up: true, icon: MessageSquare },
  { title: "Est. Cost Today", value: "$42.15", change: "-3%", up: false, icon: DollarSign },
];

const dailyData = [
  { day: "Mon", msgs: 6200 },
  { day: "Tue", msgs: 7100 },
  { day: "Wed", msgs: 6800 },
  { day: "Thu", msgs: 8400 },
  { day: "Fri", msgs: 9100 },
  { day: "Sat", msgs: 5200 },
  { day: "Sun", msgs: 4800 },
];

const maxMsgs = Math.max(...dailyData.map((d) => d.msgs));

const tokenData = [
  { label: "Input Tokens", value: 2_450_000, pct: 62 },
  { label: "Output Tokens", value: 1_500_000, pct: 38 },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold text-foreground tracking-tight">Dashboard</h1>
          <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>

        {/* Stat cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.title} className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="flex items-start justify-between p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{s.title}</p>
                  <p className="text-3xl font-semibold text-foreground tracking-tight">{s.value}</p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      s.up ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {s.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {s.change}
                  </span>
                </div>
                <div className="rounded-xl bg-accent p-3">
                  <s.icon className="h-5 w-5 text-accent-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Daily messages bar chart */}
          <Card className="lg:col-span-2 shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Daily Message Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end gap-4 h-52">
                {dailyData.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-3">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-10 rounded-t-lg bg-primary/80 hover:bg-primary transition-colors"
                        style={{ height: `${(d.msgs / maxMsgs) * 180}px` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Token usage */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Token Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              {tokenData.map((t) => (
                <div key={t.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">{t.label}</span>
                    <span className="font-semibold text-foreground">
                      {(t.value / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-2.5 rounded-full bg-primary transition-all"
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs font-medium text-muted-foreground pt-2 border-t border-border/60">
                Total: 3.95M tokens today
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
