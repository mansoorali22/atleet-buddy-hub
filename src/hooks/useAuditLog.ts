import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/audit.service";

export function useAuditLog(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ["audit-log", params],
    queryFn: () => auditService.list(params),
    retry: false,
  });
}
