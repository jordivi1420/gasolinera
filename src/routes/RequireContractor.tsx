// src/routes/RequireContractor.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireContractor() {
  const { user, profile, loading } = useAuth();
  const loc = useLocation();

  if (loading) return null; // o spinner

  const isContractor =
    !!user &&
    (profile?.role === "contractor_admin" || profile?.role === "contractor_user");

  return isContractor ? <Outlet /> : <Navigate to="/contractor/signin" state={{ from: loc }} replace />;
}
