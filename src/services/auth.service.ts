import { apiRequest } from "@/services/api";
import type { AdminUser, ChangePasswordRequest, LoginRequest, LoginResponse } from "@/types/auth";

export const authService = {
  login(payload: LoginRequest) {
    return apiRequest<LoginResponse>("/auth/login", { method: "POST", body: payload });
  },
  me() {
    return apiRequest<AdminUser>("/auth/me");
  },
  changePassword(payload: ChangePasswordRequest) {
    return apiRequest<{ message: string }>("/auth/change-password", { method: "POST", body: payload });
  },
};
