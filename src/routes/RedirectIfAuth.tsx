// src/routes/RedirectIfAuth.tsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RedirectIfAuth() {
  const { user, profile, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="p-6">Cargando…</div>;

  // Si ya está logueado (y tiene perfil), redirige a Home (o a donde quieras)
  if (user && profile) {
    // si vienes de /signin o /signup, mandamos al home:
    return <Navigate to="/" replace state={{ from: loc }} />;
  }

  // Si NO está logueado, deja ver las rutas públicas (signin/signup)
  return <Outlet />;
}
