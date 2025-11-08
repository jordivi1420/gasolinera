// src/pages/admin/sucursales/manage/SucursalManageLayout.tsx
import { NavLink, Outlet, useNavigate,  } from "react-router-dom";

export default function SucursalManageLayout() {
  const navigate = useNavigate();
 

  const tabs = [
    { to: "subcentros",   label: "Subcentros" },
    { to: "contratistas", label: "Contratistas" },
    { to: "usuarios",     label: "Usuarios" },
    { to: "reportes",     label: "Reportes" },
  ];

  return (
    <div className="space-y-4">
      {/* Header con botón regresar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/sucursales")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            title="Volver a la sucursal"
          >
            <span className="inline-block h-3 w-3 rotate-180 border-l-2 border-b-2 border-current" />
            Volver
          </button>
          <h2 className="text-base font-semibold">Gestionar sucursal</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to} // rutas RELATIVAS al layout /gestionar
            className={({ isActive }) =>
              `rounded-lg border px-4 py-2 text-sm ${
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
              }`
            }
            end
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      {/* Contenido de la pestaña */}
      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <Outlet />
      </div>
    </div>
  );
}
