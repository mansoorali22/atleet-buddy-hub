import { useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MessageSquareOff } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRefusalTrend, useRefusalList } from "@/hooks/useRefusals";
import type { RefusalItem } from "@/types/refusal";

function formatTs(iso: string | null): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "MMM d, yyyy HH:mm");
  } catch {
    return iso;
  }
}

export default function RefusalsPage() {
  const to = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const from = useMemo(() => format(subDays(new Date(), 29), "yyyy-MM-dd"), []);

  const [page, setPage] = useState(1);
  const perPage = 20;

  const trend = useRefusalTrend(from, to);
  const list = useRefusalList(from, to, page, perPage);

  const items = list.data?.items ?? [];
  const totalPages = list.data?.pages ?? 1;
  const totalRefusals = list.data?.total ?? 0;

  const barData = useMemo(
    () =>
      (trend.data ?? []).map((row) => ({
        ...row,
        label: row.date.length >= 10 ? row.date.slice(5, 10) : row.date,
      })),
    [trend.data],
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

        {(list.error || trend.error) && (
          <p className="text-sm text-destructive">
            {((list.error || trend.error) as Error)?.message ?? "Failed to load refusal data."}
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

        {/* Refused messages list */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Refused messages
          </h2>

          {list.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          )}

          <div className="space-y-3">
            {items.map((r: RefusalItem) => (
              <Card key={r.id} className="shadow-sm">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="mt-0.5 rounded-lg p-2.5 bg-destructive/10">
                    <MessageSquareOff className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{r.whatsapp_number}</span>
                      {r.refusal_category && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {r.refusal_category.replace(/_/g, " ")}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{formatTs(r.created_at)}</span>
                    </div>
                    <div className="rounded-lg bg-secondary/50 px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">User asked:</p>
                      <p className="text-sm text-foreground">{r.user_message}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/5 px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Bot refused:</p>
                      <p className="text-sm text-foreground">{r.bot_response}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!list.isLoading && items.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No refusals in this period.
              </p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalRefusals} refusals)
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
      </div>
    </DashboardLayout>
  );
}
