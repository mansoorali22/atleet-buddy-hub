import { apiRequest } from "@/services/api";
import type { AlertListResponse, AlertStats, Alert } from "@/types/alert";

export const alertsService = {
  list(status?: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    return apiRequest<AlertListResponse>(`/alerts${params.size ? `?${params}` : ""}`);
  },
  stats() {
    return apiRequest<AlertStats>("/alerts/stats");
  },
  acknowledge(id: number) {
    return apiRequest<Alert>(`/alerts/${id}`, {
      method: "PATCH",
      body: { status: "acknowledged" },
    });
  },
  resolve(id: number) {
    return apiRequest<Alert>(`/alerts/${id}`, {
      method: "PATCH",
      body: { status: "resolved" },
    });
  },
};
