export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "active" | "acknowledged" | "resolved";

export interface Alert {
  id: number;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  acknowledged_by: number | null;
  acknowledged_at: string | null;
  details: Record<string, unknown> | null;
  created_at: string | null;
}

export interface AlertListResponse {
  alerts: Alert[];
  total: number;
  page: number;
  pages: number;
}

export interface AlertStats {
  active_info: number;
  active_warning: number;
  active_critical: number;
  total_active: number;
}
