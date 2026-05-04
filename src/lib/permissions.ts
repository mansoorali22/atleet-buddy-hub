import type { Role } from "@/types/auth";

export function isAdmin(role: Role | undefined): boolean {
  return role === "admin";
}

/** Plan / status / dates / block / unblock */
export function canEditSubscriptions(role: Role | undefined): boolean {
  return role === "admin";
}

/** Manual WhatsApp from dashboard */
export function canSendManualWhatsApp(role: Role | undefined): boolean {
  return role === "admin" || role === "support";
}

/** Full audit log vs own rows only (UI hint; backend must enforce for support). */
export function canViewAllAuditEntries(role: Role | undefined): boolean {
  return role === "admin";
}

export function canEditAlertConfig(role: Role | undefined): boolean {
  return role === "admin";
}

export function canAccessMonitoring(role: Role | undefined): boolean {
  return role === "admin";
}
