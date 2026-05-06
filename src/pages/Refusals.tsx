import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRefusalGroups, useRefusalTrend } from "@/hooks/useRefusals";

export default function RefusalsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const to = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const from = useMemo(() => format(subDays(new Date(), 29), "yyyy-MM-dd"), []);

  const groups = useRefusalGroups(from, to);
  const trend = useRefusalTrend(from, to);

  const barData = useMemo(
    () =>
      (trend.data ?? []).map((row) => ({
        ...row,
        label: row.date.length >= 10 ? row.date.slice(5, 10) : row.date,
      })),
    [trend.data],
  );

  const totalRefusals = useMemo(
    () => (groups.data ?? []).reduce((sum, g) => sum + g.count, 0),
    [groups.data],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Refusal Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Last 30 days &middot; {totalRefusals} total refusals
          </p>
        </div>

        {(groups.error || trend.error) && (
          <p className="text-sm text-destructive">
            {((groups.error || trend.error) as Error)?.message ?? "Failed to load refusal data."}
          </p>
        )}

        {/* Trend chart */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Daily refusal trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] pt-0">
            {trend.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={40} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      v,
                      name === "refusals" ? "Refusals" : name,
                    ]}
                    labelFormatter={(_, p) => (p?.[0]?.payload?.date as string) ?? ""}
                  />
                  <Bar dataKey="refusals" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Grouped by category */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            By category
          </h2>
          {groups.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          )}
          <div className="space-y-3">
            {(groups.data ?? []).map((g) => (
              <Card key={g.category} className="shadow-sm">
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpanded(expanded === g.category ? null : g.category)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {expanded === g.category ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-foreground capitalize">
                        {g.category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{g.percentage}%</span>
                      <span className="rounded-full bg-destructive/10 px-3 py-0.5 text-xs font-medium text-destructive">
                        {g.count} refusals
                      </span>
                    </div>
                  </button>
                  {expanded === g.category && (
                    <div className="border-t border-border px-5 py-3">
                      <p className="text-xs text-muted-foreground">
                        {g.count} refusals ({g.percentage}% of total)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {!groups.isLoading && (groups.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No refusals in this period.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
