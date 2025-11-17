// src/pages/admin/sucursales/manage/SubcentrosPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type SubcentroRow = { id: string; nombre: string; activo?: boolean };

// mock temporal — param no usado aún
async function listSubcentrosBySucursal(_sucursalId: string): Promise<SubcentroRow[]> {
  // return [{ id:"sc-1", nombre:"Taller 1", activo:true }];
  return [];
}

export default function SubcentrosPage() {
  const { sucursalId } = useParams<{ sucursalId: string }>();
  const [rows, setRows] = useState<SubcentroRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!sucursalId) return;
      setLoading(true);
      const data = await listSubcentrosBySucursal(sucursalId);
      setRows(data);
      setLoading(false);
    })();
  }, [sucursalId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Subcentros</h3>

      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">Sin subcentros</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/10">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{r.nombre}</p>
                <p className="text-xs text-gray-500">{r.activo ? "Activo" : "Inactivo"}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700">
                  Editar
                </button>
                <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700">
                  Desactivar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
