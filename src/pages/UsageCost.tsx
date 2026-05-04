import { useCallback, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarIcon, Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUsageDaily, useUsagePerUser, useUsageSummary } from "@/hooks/useUsage";
import { cn } from "@/lib/utils";
import type { PerUserUsage } from "@/types/usage";

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 4 }).format(n);
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function exportPerUserCsv(rows: PerUserUsage[], from: string, to: string) {
  const header = ["whatsapp_number", "messages", "prompt_tokens", "completion_tokens", "cost_usd"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.whatsapp_number, r.messages, r.prompt_tokens, r.completion_tokens, r.cost].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `usage-per-user_${from}_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function UsageCostPage() {
  const defaultTo = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => subDays(defaultTo, 29), [defaultTo]);
  const [range, setRange] = useState<DateRange | undefined>({ from: defaultFrom, to: defaultTo });

  const fromStr = range?.from ? format(range.from, "yyyy-MM-dd") : undefined;
  const toStr = range?.to ? format(range.to, "yyyy-MM-dd") : range?.from ? format(range.from, "yyyy-MM-dd") : undefined;

  const summary = useUsageSummary(fromStr, toStr);
  const daily = useUsageDaily(fromStr, toStr);
  const perUser = useUsagePerUser(fromStr, toStr);

  const chartDaily = useMemo(
    () =>
      (daily.data ?? []).map((d) => ({
        ...d,
        label: d.date.length >= 10 ? d.date.slice(5, 10) : d.date,
      })),
    [daily.data],
  );

  const onExport = useCallback(() => {
    if (!fromStr || !toStr || !perUser.data?.length) return;
    exportPerUserCsv(perUser.data, fromStr, toStr);
  }, [fromStr, toStr, perUser.data]);

  const err = summary.error ?? daily.error ?? perUser.error;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-heading text-2xl font-semibold text-foreground">Usage & Cost Analytics</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal", !fromStr && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromStr && toStr ? `${fromStr} — ${toStr}` : "Pick a range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={range?.from}
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="secondary" size="sm" onClick={onExport} disabled={!perUser.data?.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {err && (
          <p className="text-sm text-destructive" role="alert">
            {(err as Error).message}
          </p>
        )}

        {/* Aggregate */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-sm">
            <CardContent className="space-y-1 p-5">
              <p className="text-sm text-muted-foreground">Total Messages</p>
              <p className="font-heading text-2xl font-semibold text-foreground">
                {summary.isLoading ? "…" : (summary.data?.total_messages ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="space-y-1 p-5">
              <p className="text-sm text-muted-foreground">Total Tokens</p>
              <p className="font-heading text-2xl font-semibold text-foreground">
                {summary.isLoading
                  ? "…"
                  : formatTokens((summary.data?.total_prompt_tokens ?? 0) + (summary.data?.total_completion_tokens ?? 0))}
              </p>
              <p className="text-xs text-muted-foreground">
                In {(summary.data?.total_prompt_tokens ?? 0).toLocaleString()} · Out{" "}
                {(summary.data?.total_completion_tokens ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="space-y-1 p-5">
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <p className="font-heading text-2xl font-semibold text-foreground">
                {summary.isLoading ? "…" : formatUsd(summary.data?.total_cost ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Active users (range): {(summary.data?.active_users ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-body text-base font-medium text-foreground">Daily messages</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] pt-2">
              {daily.isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDaily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" width={48} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8 }}
                      formatter={(v: number) => [v.toLocaleString(), "Messages"]}
                      labelFormatter={(_, p) => (p?.[0]?.payload?.date as string) ?? ""}
                    />
                    <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-body text-base font-medium text-foreground">Cost trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] pt-2">
              {daily.isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDaily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" width={56} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8 }}
                      formatter={(v: number) => [formatUsd(v), "Cost"]}
                      labelFormatter={(_, p) => (p?.[0]?.payload?.date as string) ?? ""}
                    />
                    <Area type="monotone" dataKey="cost" stroke="hsl(var(--primary))" fill="url(#costFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Per-user table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-body text-base font-medium text-foreground">Per-user usage</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">WhatsApp</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Messages</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Prompt tokens</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Completion tokens</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Est. cost</th>
                  </tr>
                </thead>
                <tbody>
                  {perUser.isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  ) : !perUser.data?.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No rows in this range.
                      </td>
                    </tr>
                  ) : (
                    perUser.data.map((u) => (
                      <tr
                        key={u.whatsapp_number}
                        className="border-b border-border transition-colors last:border-0 hover:bg-secondary/50"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{u.whatsapp_number}</td>
                        <td className="px-4 py-3 text-foreground">{u.messages.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.prompt_tokens.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.completion_tokens.toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{formatUsd(u.cost)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
