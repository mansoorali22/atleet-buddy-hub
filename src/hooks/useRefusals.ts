import { useQuery } from "@tanstack/react-query";
import { refusalsService } from "@/services/refusals.service";

export function useRefusalGroups(from?: string, to?: string) {
  return useQuery({
    queryKey: ["refusal-groups", from, to],
    queryFn: () => refusalsService.grouped(from, to),
  });
}

export function useRefusalTrend(from?: string, to?: string) {
  return useQuery({
    queryKey: ["refusal-trend", from, to],
    queryFn: () => refusalsService.trend(from, to),
  });
}
