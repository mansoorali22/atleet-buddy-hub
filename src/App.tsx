import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import UsageCost from "./pages/UsageCost";
import Refusals from "./pages/Refusals";
import AuditLog from "./pages/AuditLog";
import AlertsPage from "./pages/AlertsPage";
import ChangePassword from "./pages/ChangePassword";
import SupportAccounts from "./pages/SupportAccounts";
import FAQPage from "./pages/FAQPage";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={["admin", "support"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={["admin", "support"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usage"
              element={
                <ProtectedRoute roles={["admin", "support"]}>
                  <UsageCost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/refusals"
              element={
                <ProtectedRoute roles={["admin", "support"]}>
                  <Refusals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-log"
              element={
                <ProtectedRoute adminOnly>
                  <AuditLog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute roles={["admin", "support"]}>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute roles={["admin", "support"]}>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faq"
              element={
                <ProtectedRoute adminOnly>
                  <FAQPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support-accounts"
              element={
                <ProtectedRoute adminOnly>
                  <SupportAccounts />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
