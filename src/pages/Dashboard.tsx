import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, CreditCard, MessageSquare, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats, useUsageDaily, useUsageSummary } from "@/hooks/useUsage";

function pctChangeLabel(current: number, previous: number): { text: string; up: boolean } {
  if (previous === 0 && current === 0) return { text: "0%", up: true };
  if (previous === 0) return { text: "+100%", up: true };
  const p = ((current - previous) / previous) * 100;
  const sign = p >= 0 ? "+" : "";
  return { text: `${sign}${p.toFixed(0)}%`, up: p >= 0 };
}

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const weekFrom = useMemo(() => format(subDays(new Date(), 6), "yyyy-MM-dd"), []);

  const dash = useDashboardStats();
  const weekDaily = useUsageDaily(weekFrom, today);
  const todaySummary = useUsageSummary(today, today);

  const msgChange = useMemo(() => {
    const d = dash.data;
    if (!d) return { text: "—", up: true };
    return pctChangeLabel(d.messages_today, d.messages_yesterday);
  }, [dash.data]);

  const costChange = useMemo(() => {
    const d = dash.data;
    if (!d) return { text: "—", up: true };
    return pctChangeLabel(d.cost_today_usd, d.cost_yesterday_usd);
  }, [dash.data]);

  const barData = useMemo(
    () =>
      (weekDaily.data ?? []).map((row) => ({
        ...row,
        label: row.date.length >= 10 ? row.date.slice(5, 10) : row.date,
      })),
    [weekDaily.data],
  );

  const prompt = todaySummary.data?.total_prompt_tokens ?? 0;
  const completion = todaySummary.data?.total_completion_tokens ?? 0;
  const totalTok = prompt + completion;
  const inputPct = totalTok > 0 ? Math.round((prompt / totalTok) * 100) : 0;
  const outputPct = totalTok > 0 ? 100 - inputPct : 0;

  const stats = [
    {
      title: "Total Users",
      value: dash.data ? dash.data.total_users.toLocaleString() : dash.isLoading ? "…" : "—",
      change: "Subscriptions",
      up: true,
      icon: Users,
      hideTrend: true,
      link: "/users",
    },
    {
      title: "Active Subscriptions",
      value: dash.data ? dash.data.active_subscriptions.toLocaleString() : dash.isLoading ? "…" : "—",
      change: "Non-trial active",
      up: true,
      icon: CreditCard,
      hideTrend: true,
      link: "/users",
    },
    {
      title: "Messages Today",
      value: dash.data ? dash.data.messages_today.toLocaleString() : dash.isLoading ? "…" : "—",
      change: msgChange.text,
      up: msgChange.up,
      icon: MessageSquare,
      hideTrend: false,
      link: "/usage",
    },
    {
      title: "Est. Cost Today",
      value: dash.data ? formatUsd(dash.data.cost_today_usd) : dash.isLoading ? "…" : "—",
      change: costChange.text,
      up: costChange.up,
      icon: DollarSign,
      hideTrend: false,
      link: "/usage",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </span>
        </div>

        {dash.error && (
          <p className="text-sm text-destructive" role="alert">
            {(dash.error as Error).message}
          </p>
        )}

        {/* Stat cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card
              key={s.title}
              className="border-border/60 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
              onClick={() => navigate(s.link)}
            >
              <CardContent className="flex items-start justify-between p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{s.title}</p>
                  <p className="text-3xl font-semibold tracking-tight text-foreground">{s.value}</p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      s.hideTrend ? "text-muted-foreground" : s.up ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {!s.hideTrend && (s.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />)}
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
          <Card className="border-border/60 shadow-sm lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Daily message usage (last 7 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[220px] pt-0">
              {weekDaily.isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={40} />
                    <Tooltip
                      formatter={(v: number) => [v.toLocaleString(), "Messages"]}
                      labelFormatter={(_, p) => (p?.[0]?.payload?.date as string) ?? ""}
                    />
                    <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-foreground">Token usage (today)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
              {todaySummary.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Input tokens</span>
                      <span className="font-semibold text-foreground">{prompt.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-2.5 rounded-full bg-primary transition-all" style={{ width: `${inputPct}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Output tokens</span>
                      <span className="font-semibold text-foreground">{completion.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-2.5 rounded-full bg-primary/70 transition-all" style={{ width: `${outputPct}%` }} />
                    </div>
                  </div>
                  <p className="border-t border-border/60 pt-2 text-xs font-medium text-muted-foreground">
                    Total: {totalTok.toLocaleString()} tokens ({inputPct}% / {outputPct}%)
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
