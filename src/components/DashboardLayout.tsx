import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ShieldAlert,
  ScrollText,
  Bell,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types/auth";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin", "support"] as Role[] },
  { title: "Users", path: "/users", icon: Users, roles: ["admin", "support"] as Role[] },
  { title: "Usage & Cost", path: "/usage", icon: BarChart3, roles: ["admin", "support"] as Role[] },
  { title: "Refusals", path: "/refusals", icon: ShieldAlert, roles: ["admin", "support"] as Role[] },
  { title: "Audit Log", path: "/audit-log", icon: ScrollText, roles: ["admin", "support"] as Role[] },
  { title: "Alerts", path: "/alerts", icon: Bell, roles: ["admin", "support"] as Role[] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const allowedNavItems = navItems.filter((item) => (user ? item.roles.includes(user.role) : false));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-card transition-all duration-300 ${
          sidebarOpen ? "w-60" : "w-0 -translate-x-full lg:w-16 lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary font-bold text-base text-primary-foreground shadow-sm">
            A
          </div>
          {sidebarOpen && (
            <span className="font-heading text-lg font-semibold text-foreground tracking-tight">
              Atleet Buddy
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {allowedNavItems.map((item) => {
            return (
            <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {sidebarOpen && <span>{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          sidebarOpen ? "lg:ml-60" : "lg:ml-16"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-6 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs border border-primary/20">
              {user?.display_name.slice(0, 2).toUpperCase() ?? "NA"}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-medium">{user?.display_name ?? "Unknown"}</span>
              {user && <Badge variant="secondary">{user.role}</Badge>}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
