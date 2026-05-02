export type UserStatus = "active" | "expired" | "blocked" | "inactive";

export interface User {
  whatsapp_number: string;
  status: UserStatus;
  plan_name: string | null;
  is_recurring: boolean;
  credits: number;
  message_count: number;
  is_trial: boolean;
  subscription_start: string | null;
  subscription_end: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

export interface UserListFilters {
  search?: string;
  status?: UserStatus | "all";
  plan?: string | "all";
  page?: number;
  per_page?: number;
}
