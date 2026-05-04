import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authService } from "@/services/auth.service";
import { setAccessToken } from "@/services/api";
import { readStoredToken, writeStoredToken } from "@/lib/authSession";
import type { AdminUser, LoginRequest } from "@/types/auth";

type AuthContextType = {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** False after we finish reading session + optional /auth/me */
  isBootstrapping: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const stored = readStoredToken();
      if (!stored) {
        if (!cancelled) setIsBootstrapping(false);
        return;
      }

      setAccessToken(stored);
      try {
        const me = await authService.me();
        if (cancelled) return;
        setToken(stored);
        setUser(me);
      } catch {
        if (cancelled) return;
        writeStoredToken(null);
        setAccessToken(null);
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      login: async (payload: LoginRequest) => {
        const response = await authService.login(payload);
        writeStoredToken(response.access_token);
        setToken(response.access_token);
        setAccessToken(response.access_token);
        setUser(response.admin);
      },
      logout: () => {
        writeStoredToken(null);
        setToken(null);
        setUser(null);
        setAccessToken(null);
      },
    }),
    [isBootstrapping, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
