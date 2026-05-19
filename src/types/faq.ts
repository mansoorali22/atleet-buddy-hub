export interface FAQItem {
  id: number;
  question_text: string;
  answer_text: string;
  language: string | null;
  hit_count: number;
  last_hit_at: string | null;
  created_at: string | null;
}

export interface FAQListResponse {
  items: FAQItem[];
  total: number;
  page: number;
  pages: number;
}

export interface FAQStats {
  total_entries: number;
  total_hits: number;
  cache_hit_savings_usd: number;
}
