import { apiRequest } from "@/services/api";
import type {
  SendMessageBody,
  UpdateDatesBody,
  UpdatePlanBody,
  UpdateStatusBody,
  User,
  UserDetailResponse,
  UserListFilters,
  UserListResponse,
} from "@/types/user";

const toQuery = (filters: UserListFilters) => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.plan && filters.plan !== "all") params.set("plan", filters.plan);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));
  return params.toString();
};

const userPath = (whatsappNumber: string) =>
  `/users/${encodeURIComponent(whatsappNumber)}`;

export const usersService = {
  list(filters: UserListFilters) {
    const query = toQuery(filters);
    return apiRequest<UserListResponse>(`/users${query ? `?${query}` : ""}`);
  },
  detail(whatsappNumber: string) {
    return apiRequest<UserDetailResponse>(userPath(whatsappNumber));
  },
  updatePlan(whatsappNumber: string, body: UpdatePlanBody) {
    return apiRequest<User>(`${userPath(whatsappNumber)}/plan`, { method: "PATCH", body });
  },
  updateStatus(whatsappNumber: string, body: UpdateStatusBody) {
    return apiRequest<User>(`${userPath(whatsappNumber)}/status`, { method: "PATCH", body });
  },
  updateDates(whatsappNumber: string, body: UpdateDatesBody) {
    return apiRequest<User>(`${userPath(whatsappNumber)}/dates`, { method: "PATCH", body });
  },
  block(whatsappNumber: string) {
    return apiRequest<User>(`${userPath(whatsappNumber)}/block`, { method: "POST" });
  },
  unblock(whatsappNumber: string) {
    return apiRequest<User>(`${userPath(whatsappNumber)}/unblock`, { method: "POST" });
  },
  sendMessage(whatsappNumber: string, body: SendMessageBody) {
    return apiRequest<void>(`${userPath(whatsappNumber)}/send`, { method: "POST", body });
  },
};
