import { apiRequest } from "@/services/api";
import type { DailyUsage, PerUserUsage, UsageSummary } from "@/types/usage";

export const usageService = {
  summary(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return apiRequest<UsageSummary>(`/usage/summary${params.size ? `?${params}` : ""}`);
  },
  daily(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return apiRequest<DailyUsage[]>(`/usage/daily${params.size ? `?${params}` : ""}`);
  },
  perUser(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return apiRequest<PerUserUsage[]>(`/usage/per-user${params.size ? `?${params}` : ""}`);
  },
};
