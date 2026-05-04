/** Same-tab refresh only; cleared when the tab closes (not localStorage). */
const KEY = "atleet_admin_jwt";

export function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeStoredToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(KEY, token);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
