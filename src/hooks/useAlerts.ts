import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsService } from "@/services/alerts.service";

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => alertsService.list(),
    refetchInterval: 30000,
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertsService.resolve(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
