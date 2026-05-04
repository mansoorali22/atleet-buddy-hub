import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";

export function useUserDetail(whatsappNumber: string | null) {
  return useQuery({
    queryKey: ["user-detail", whatsappNumber],
    queryFn: () => usersService.detail(whatsappNumber as string),
    enabled: Boolean(whatsappNumber),
  });
}
