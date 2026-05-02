export interface AuditEvent {
  id: number;
  actor_id: number | null;
  actor_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditListResponse {
  events: AuditEvent[];
  total: number;
  page: number;
  pages: number;
}
