import { apiRequest } from "@/services/api";
import type { User, UserListFilters, UserListResponse } from "@/types/user";

const toQuery = (filters: UserListFilters) => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.plan && filters.plan !== "all") params.set("plan", filters.plan);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));
  return params.toString();
};

export const usersService = {
  list(filters: UserListFilters) {
    const query = toQuery(filters);
    return apiRequest<UserListResponse>(`/users${query ? `?${query}` : ""}`);
  },
  detail(whatsappNumber: string) {
    return apiRequest<User>(`/users/${encodeURIComponent(whatsappNumber)}`);
  },
};
