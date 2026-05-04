export interface UsageSummary {
  total_messages: number;
  active_users: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_cost: number;
}

export interface DailyUsage {
  date: string;
  messages: number;
  prompt_tokens: number;
  completion_tokens: number;
  cost: number;
}

export interface PerUserUsage {
  whatsapp_number: string;
  messages: number;
  prompt_tokens: number;
  completion_tokens: number;
  cost: number;
}

/** GET /admin/usage/dashboard — home stat cards */
export interface DashboardStats {
  total_users: number;
  active_subscriptions: number;
  messages_today: number;
  cost_today_usd: number;
  messages_yesterday: number;
  cost_yesterday_usd: number;
}
