import { apiRequest } from "@/services/api";
import type { Alert, AlertConfig } from "@/types/alert";

export const alertsService = {
  list() {
    return apiRequest<Alert[]>("/alerts");
  },
  resolve(id: number) {
    return apiRequest<void>(`/alerts/${id}/resolve`, { method: "PATCH" });
  },
  getConfig() {
    return apiRequest<AlertConfig[]>("/alerts/config");
  },
  updateConfig(payload: AlertConfig) {
    return apiRequest<AlertConfig>("/alerts/config", { method: "PUT", body: payload });
  },
};
