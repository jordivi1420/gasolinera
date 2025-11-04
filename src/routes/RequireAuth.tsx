// src/routes/RequireAuth.tsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth() {
  const { user, profile, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="p-6">Cargando…</div>;
  if (!user || !profile) return <Navigate to="/signin" replace state={{ from: loc }} />;

  return <Outlet />;
}
