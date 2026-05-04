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

export interface ChatLogEntry {
  id: number;
  whatsapp_number: string;
  user_message: string;
  bot_response: string;
  response_type: string | null;
  created_at: string | null;
}

export interface UserDetailResponse {
  user: User;
  recent_chat_logs: ChatLogEntry[];
}

export interface UpdatePlanBody {
  plan_name: string;
  credits?: number;
  is_recurring?: boolean;
}

export interface UpdateStatusBody {
  status: UserStatus;
}

export interface UpdateDatesBody {
  subscription_start: string;
  subscription_end: string;
}

export interface SendMessageBody {
  message: string;
}
