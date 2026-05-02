import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authService } from "@/services/auth.service";
import { setAccessToken } from "@/services/api";
import type { AdminUser, LoginRequest } from "@/types/auth";

type AuthContextType = {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login: async (payload: LoginRequest) => {
        const response = await authService.login(payload);
        setToken(response.access_token);
        setAccessToken(response.access_token);
        setUser(response.admin);
      },
      logout: () => {
        setToken(null);
        setUser(null);
        setAccessToken(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
