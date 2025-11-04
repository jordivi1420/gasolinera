// src/routes/RequireAdmin.tsx
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAdmin() {
  const { profile } = useAuth();

  if (!profile?.is_admin_global) return <Navigate to="/" replace />;
  return <Outlet />;
}
