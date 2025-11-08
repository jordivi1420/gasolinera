// src/pages/admin/sucursales/manage/ReportesPage.tsx
import { useParams } from "react-router-dom";

export default function ReportesPage() {
  const { sucursalId } = useParams();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Reportes</h3>
        <button className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5">
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4 dark:border-white/10">
          <p className="text-sm text-gray-500">Total contratistas</p>
          <p className="mt-1 text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-xl border p-4 dark:border-white/10">
          <p className="text-sm text-gray-500">Usuarios activos</p>
          <p className="mt-1 text-2xl font-semibold">—</p>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Sucursal: <span className="font-medium">{sucursalId}</span>
      </p>
    </div>
  );
}
