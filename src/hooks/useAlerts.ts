import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsService } from "@/services/alerts.service";

export function useAlerts(status?: string) {
  return useQuery({
    queryKey: ["alerts", status],
    queryFn: () => alertsService.list(status),
    refetchInterval: 30000,
  });
}

export function useAlertStats() {
  return useQuery({
    queryKey: ["alert-stats"],
    queryFn: () => alertsService.stats(),
    refetchInterval: 30000,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertsService.acknowledge(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
      await queryClient.invalidateQueries({ queryKey: ["alert-stats"] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertsService.resolve(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
      await queryClient.invalidateQueries({ queryKey: ["alert-stats"] });
    },
  });
}

export function useReopenAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertsService.reopen(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
      await queryClient.invalidateQueries({ queryKey: ["alert-stats"] });
    },
  });
}
