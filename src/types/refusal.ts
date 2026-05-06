export interface RefusalGroup {
  category: string;
  count: number;
  percentage: number;
}

export interface RefusalTrendPoint {
  date: string;
  refusals: number;
  total_messages: number;
  refusal_rate: number;
}

export interface RefusalItem {
  id: number;
  whatsapp_number: string;
  user_message: string;
  bot_response: string;
  refusal_category: string | null;
  created_at: string | null;
}

export interface RefusalListResponse {
  items: RefusalItem[];
  total: number;
  page: number;
  pages: number;
}
