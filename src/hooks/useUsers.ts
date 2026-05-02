import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import type { UserListFilters } from "@/types/user";

export function useUsers(filters: UserListFilters) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: () => usersService.list(filters),
  });
}
