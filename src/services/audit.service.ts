import { apiRequest } from "@/services/api";
import type { AuditListResponse } from "@/types/audit";

export const auditService = {
  list(params?: Record<string, string | number | undefined>) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") query.set(key, String(value));
      });
    }
    return apiRequest<AuditListResponse>(`/audit${query.size ? `?${query}` : ""}`);
  },
};
