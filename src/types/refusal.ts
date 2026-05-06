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
