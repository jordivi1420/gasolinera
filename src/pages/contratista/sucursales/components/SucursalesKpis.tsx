// src/pages/admin/sucursales/SucursalesKpis.tsx
import { useEffect, useState } from "react";
import { GroupIcon, CheckCircleIcon } from "../../../../icons";
import Badge from "../../../../components/ui/badge/Badge";
import { countSucursalesKpis } from "../../../../services/sucursales.paging.service";

type Kpi = { total: number; activas: number };

export default function SucursalesKpis() {
  const [kpi, setKpi] = useState<Kpi>({ total: 0, activas: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Carga KPIs (no retorna nada). El control de "mounted" vive en useEffect
  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await countSucursalesKpis();
      setKpi({ total: res.total ?? 0, activas: res.activas ?? 0 });
    } catch (_e) {
      setErr("No se pudieron cargar los KPIs. Reintenta.");
    } finally {
      setLoading(false);
    }
  }
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    // envolvemos setState para evitar llamadas tras el unmount
    const safe = {
      setKpi: (v: Kpi) => mounted && setKpi(v),
      setLoading: (v: boolean) => mounted && setLoading(v),
      setErr: (v: string | null) => mounted && setErr(v),
    };

    (async () => {
      safe.setLoading(true);
      safe.setErr(null);
      try {
        const res = await countSucursalesKpis();
        safe.setKpi({ total: res.total ?? 0, activas: res.activas ?? 0 });
      } catch (_e) {
        safe.setErr("No se pudieron cargar los KPIs. Reintenta.");
      } finally {
        safe.setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6"
      aria-busy={loading}
      aria-live="polite"
    >
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

      {/* Error / Retry inline (opcional) */}
      {err && (
        <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center justify-between">
            <span>{err}</span>
            <button
              onClick={() => load()}
              className="inline-flex items-center rounded-lg border border-red-300 px-3 py-1 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
              disabled={loading}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
