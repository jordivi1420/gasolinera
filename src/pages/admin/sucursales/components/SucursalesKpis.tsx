// src/pages/admin/sucursales/SucursalesKpis.tsx
import { useEffect, useState } from "react";
import { GroupIcon, CheckCircleIcon } from "../../../../icons";
import Badge from "../../../../components/ui/badge/Badge";
import { countSucursalesKpis } from "../../../../services/sucursales.paging.service";

export default function SucursalesKpis() {
  const [kpi, setKpi] = useState({ total: 0, activas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await countSucursalesKpis();
      setKpi(res);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Total sucursales */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Sucursales</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "—" : kpi.total}
            </h4>
          </div>
          <Badge color="success">Total</Badge>
        </div>
      </div>

      {/* Sucursales activas */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <CheckCircleIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Sucursales activas</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "—" : kpi.activas}
            </h4>
          </div>
          <Badge color="success">Activas</Badge>
        </div>
      </div>
    </div>
  );
}
