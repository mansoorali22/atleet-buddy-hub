export type AlertSeverity = "high" | "medium" | "low";
export type AlertStatus = "active" | "resolved";

export interface Alert {
  id: number;
  type: string;
  severity: AlertSeverity;
  message: string;
  metadata: Record<string, unknown> | null;
  status: AlertStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface AlertConfig {
  id: number;
  alert_type: string;
  enabled: boolean;
  threshold: Record<string, unknown>;
  updated_at: string;
}
