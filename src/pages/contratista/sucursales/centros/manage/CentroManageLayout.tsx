// src/pages/contratista/sucursales/manage/SucursalManageLayout.tsx
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";

export default function SucursalManageLayout() {
  const navigate = useNavigate();

  const { branchId, contractorId } = useParams<{
    branchId: string;
    contractorId: string;
  }>();

  const tabs = [
    { to: ".", label: "Centros" },     // index → lista de centros
    { to: "vehiculos", label: "Vehículos" }, // tab de vehículos
  ];

  return (
    <div className="space-y-4">
      {/* Header con botón regresar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/c/${branchId}/${contractorId}/sucursales`)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            title="Volver a sucursales"
          >
            <span className="inline-block h-3 w-3 rotate-180 border-l-2 border-b-2 border-current" />
            Volver
          </button>
          <div>
            <h2 className="text-base font-semibold">Gestionar sucursal</h2>
            <p className="text-xs text-gray-500">
              {branchId ? `Sucursal: ${branchId}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
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

      {/* Contenido dinámico */}
      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <Outlet />
      </div>
    </div>
  );
}
