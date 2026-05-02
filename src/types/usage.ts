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
