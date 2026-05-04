import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;
    navigate(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, isBootstrapping, navigate]);
  return null;
}
