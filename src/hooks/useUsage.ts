import { useQuery } from "@tanstack/react-query";
import { usageService } from "@/services/usage.service";

export function useUsageSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: ["usage-summary", from, to],
    queryFn: () => usageService.summary(from, to),
  });
}

export function useUsageDaily(from?: string, to?: string) {
  return useQuery({
    queryKey: ["usage-daily", from, to],
    queryFn: () => usageService.daily(from, to),
  });
}

export function useUsagePerUser(from?: string, to?: string) {
  return useQuery({
    queryKey: ["usage-per-user", from, to],
    queryFn: () => usageService.perUser(from, to),
  });
}
