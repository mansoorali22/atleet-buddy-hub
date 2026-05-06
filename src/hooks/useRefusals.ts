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

export function useRefusalList(from?: string, to?: string, page = 1, perPage = 50) {
  return useQuery({
    queryKey: ["refusal-list", from, to, page, perPage],
    queryFn: () => refusalsService.list(from, to, page, perPage),
  });
}
