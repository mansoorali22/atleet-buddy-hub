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
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Dashboard</h1>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.title} className="shadow-sm">
              <CardContent className="flex items-start justify-between p-5">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <p className="text-2xl font-semibold font-heading text-foreground">{s.value}</p>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      s.up ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {s.change}
                  </span>
                </div>
                <div className="rounded-lg bg-accent p-2.5">
                  <s.icon className="h-5 w-5 text-accent-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Daily messages bar chart */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-body font-medium text-foreground">
                Daily Message Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-end gap-3 h-48">
                {dailyData.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-8 rounded-t-md bg-primary/80 transition-all"
                        style={{ height: `${(d.msgs / maxMsgs) * 160}px` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Token usage */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-body font-medium text-foreground">
                Token Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              {tokenData.map((t) => (
                <div key={t.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.label}</span>
                    <span className="font-medium text-foreground">
                      {(t.value / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                Total: 3.95M tokens today
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
