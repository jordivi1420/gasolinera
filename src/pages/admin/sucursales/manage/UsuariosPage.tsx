// src/pages/admin/sucursales/manage/UsuariosPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type UsuarioRow = { id: string; displayName?: string; email?: string; role?: string };

// Opción A: prefijo "_"
async function listUsuariosBySucursal(_sucursalId: string): Promise<UsuarioRow[]> {
  return [];
}

// (alternativa B si prefieres mantener el nombre)
// async function listUsuariosBySucursal(sucursalId: string): Promise<UsuarioRow[]> {
//   void sucursalId; // marcalo como usado
//   return [];
// }

export default function UsuariosPage() {
  const { sucursalId } = useParams<{ sucursalId: string }>();
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!sucursalId) return;
      setLoading(true);
      const data = await listUsuariosBySucursal(sucursalId);
      setRows(data);
      setLoading(false);
    })();
  }, [sucursalId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Usuarios</h3>
        <button className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5">
          + Invitar usuario
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">Sin usuarios</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/10">
          {rows.map(u => (
            <li key={u.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{u.displayName || "(sin nombre)"}</p>
                <p className="text-xs text-gray-500">{u.email} · {u.role || "—"}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700">
                  Cambiar rol
                </button>
                <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700">
                  Quitar acceso
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
