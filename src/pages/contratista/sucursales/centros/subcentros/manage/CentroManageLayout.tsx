// src/pages/admin/sucursales/manage/SucursalManageLayout.tsx
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";

export default function CentroManageLayout() {
  const navigate = useNavigate();

  const {
    branchId,
    contractorId,
    centroId,
    subcentroId
  } = useParams<{
    branchId: string;
    contractorId: string;
    centroId: string;
    subcentroId: string;
  }>();

  // Ruta base a la lista de subcentros de ese centro
  const backToSubcentros =
    branchId && contractorId && centroId
      ? `/c/${branchId}/${contractorId}/centros/${centroId}/subcentros`
      : "/c";

  const tabs = [
    { to: "empleados", label: "Empleados" },
    { to: "vehiculos", label: "Vehículos" },
    { to: "reportes", label: "Reportes" },
  ];

  return (
    <div className="space-y-4">

      {/* ========================== */}
      {/*      DEBUG DEL SUBCENTRO   */}
      {/* ========================== */}
      <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
        <p className="font-semibold">DEBUG – Parámetros recibidos:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Sucursal (branchId):</strong> {branchId || "—"}</li>
          <li><strong>Contratista (contractorId):</strong> {contractorId || "—"}</li>
          <li><strong>Centro (centroId):</strong> {centroId || "—"}</li>
          <li><strong>Subcentro (subcentroId):</strong> {subcentroId || "—"}</li>
        </ul>
      </div>

      {/* Header con botón regresar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(backToSubcentros)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            title="Volver a subcentros"
          >
            <span className="inline-block h-3 w-3 rotate-180 border-l-2 border-b-2 border-current" />
            Volver
          </button>
          <h2 className="text-base font-semibold">Gestionar subcentro</h2>
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
