import { useQuery } from "@tanstack/react-query";
import { usageService } from "@/services/usage.service";

export function useUsageSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: ["usage-summary", from, to],
    queryFn: () => usageService.summary(from, to),
    retry: false,
  });
}

export function useUsageDaily(from?: string, to?: string) {
  return useQuery({
    queryKey: ["usage-daily", from, to],
    queryFn: () => usageService.daily(from, to),
    retry: false,
  });
}

export function useUsagePerUser(from?: string, to?: string) {
  return useQuery({
    queryKey: ["usage-per-user", from, to],
    queryFn: () => usageService.perUser(from, to),
    retry: false,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["usage-dashboard"],
    queryFn: () => usageService.dashboard(),
    retry: false,
  });
}
