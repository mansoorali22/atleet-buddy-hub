import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types/auth";

export default function ProtectedRoute({
  children,
  roles,
  adminOnly,
}: {
  children: ReactNode;
  /** If set, user must have one of these roles */
  roles?: Role[];
  /** Shorthand: only admin (e.g. monitoring, alert config) */
  adminOnly?: boolean;
}) {
  const { isAuthenticated, user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
