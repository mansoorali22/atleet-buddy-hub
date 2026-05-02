export interface RefusalGroup {
  category: string;
  count: number;
  latest: string;
}

export interface RefusalTrendPoint {
  date: string;
  refusals: number;
  total: number;
  refusal_rate: number;
}
