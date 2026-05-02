import { apiRequest } from "@/services/api";
import type { RefusalGroup, RefusalTrendPoint } from "@/types/refusal";

export const refusalsService = {
  grouped(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return apiRequest<RefusalGroup[]>(`/refusals/grouped${params.size ? `?${params}` : ""}`);
  },
  trend(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return apiRequest<RefusalTrendPoint[]>(`/refusals/trend${params.size ? `?${params}` : ""}`);
  },
};
