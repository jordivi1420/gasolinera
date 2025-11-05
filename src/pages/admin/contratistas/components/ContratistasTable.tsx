// src/pages/admin/contractors/ContractorsTable.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import Badge from "../../../../components/ui/badge/Badge";
import Select from "../../../../components/form/Select";
import { useAuth } from "../../../../context/AuthContext";

// services
import { listSucursales } from "../../../../services/sucursales.service";
import {
  listAllContratistas,
  listContratistasByBranch,
  type ContratistaRow,
} from "../../../../services/contratistas.service";

type SucursalOpt = { value: string; label: string };

export default function ContractorsTable({
  branchId: branchIdProp,
}: {
  branchId?: string;
}) {
  const nav = useNavigate();
  const { profile } = useAuth();

  const isGlobalAdmin = !!profile?.is_global_admin;

  // Estado inicial del filtro
  const [branchId, setBranchId] = useState<string | undefined>(
    branchIdProp ?? (isGlobalAdmin ? undefined : profile?.branchId ?? undefined)
  );

  const [rows, setRows] = useState<ContratistaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Sucursales para el select (admin global)
  const [sucursales, setSucursales] = useState<SucursalOpt[]>([]);

  // Cargar sucursales
  useEffect(() => {
    if (!isGlobalAdmin || branchIdProp) return;
    (async () => {
      try {
        const list = await listSucursales();
        const opts: SucursalOpt[] = [
          { value: "", label: "Todas las sucursales" },
          ...list
            .map((s) => ({ value: s.id, label: s.nombre }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        ];
        setSucursales(opts);
      } catch {
        setErr("No se pudieron cargar las sucursales.");
      }
    })();
  }, [isGlobalAdmin, branchIdProp]);

  // Cargar contratistas según el filtro
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        if (!branchId) {
          const all = await listAllContratistas();
          const sorted = [...all].sort((a, b) => a.nombre.localeCompare(b.nombre));
          setRows(sorted);
        } else {
          const list = await listContratistasByBranch(branchId);
          const sorted = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
          setRows(sorted);
        }
      } catch {
        setErr("No se pudieron cargar los contratistas.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [branchId]);

  const HEADERS = useMemo(
    () => ["Contratista", "NIT", "Contacto", "Teléfono", "Estado", "Acciones"],
    []
  );

  // Handler flexible para tu Select (por si devuelve string u objeto)
  const handleSucursalChange = (val: unknown) => {
    // si devuelve string
    if (typeof val === "string") {
      setBranchId(val ? val : undefined);
      return;
    }
    // si devuelve opción { value, label }
    if (val && typeof val === "object" && "value" in (val as any)) {
      const v = (val as any).value as string;
      setBranchId(v ? v : undefined);
      return;
    }
    // fallback (limpieza)
    setBranchId(undefined);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filtro de sucursal para admin global */}
      {isGlobalAdmin && !branchIdProp && (
        <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {branchId
              ? "Mostrando contratistas de la sucursal seleccionada"
              : "Mostrando todos los contratistas. Filtra por sucursal si deseas."}
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-64">
              <Select
                // 🔑 Truco: forzar remount cuando branchId cambia de valor/undefined
                key={branchId ?? "all"}
                options={sucursales}
                placeholder="Sucursal…"       // <- tu Select usa 'placeHolder' (H mayúscula)
                // 👇 tu Select no soporta 'value', así que no lo pasamos
                onChange={handleSucursalChange}
                // Si tu Select soporta 'isClearable', actívalo y en el clear volverá a mostrar el placeholder.
                // isClearable
              />
            </div>

            {branchId && (
              <button
                onClick={() => setBranchId(undefined)}
                className="h-10 px-3 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                title="Quitar filtro"
              >
                Quitar filtro
              </button>
            )}

            <button
              onClick={() => nav("/admin/contratistas/nueva")}
              className="inline-flex items-center h-10 px-3 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600"
            >
              + Nuevo Contratista
            </button>
          </div>
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {HEADERS.map((h) => (
                <TableCell
                  key={h}
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <TableRow>
                <TableCell
                  className="px-5 py-6 text-start text-theme-sm text-gray-500 dark:text-gray-400"
                  colSpan={HEADERS.length}
                >
                  Cargando…
                </TableCell>
              </TableRow>
            ) : err ? (
              <TableRow>
                <TableCell
                  className="px-5 py-6 text-start text-theme-sm text-red-600"
                  colSpan={HEADERS.length}
                >
                  {err}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="px-5 py-6 text-start text-theme-sm text-gray-500 dark:text-gray-400"
                  colSpan={HEADERS.length}
                >
                  {branchId
                    ? "No hay contratistas registrados en esta sucursal."
                    : "No hay contratistas registrados."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10 grid place-items-center text-xs text-gray-500">
                        {c.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {c.nombre}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          ID: {c.id}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-600 text-start text-theme-sm dark:text-gray-400">
                    {c.nit || "—"}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-600 text-start text-theme-sm dark:text-gray-400">
                    {c.contacto?.nombre || "—"}
                    {c.contacto?.email ? (
                      <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                        {c.contacto.email}
                      </span>
                    ) : null}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-600 text-start text-theme-sm dark:text-gray-400">
                    {c.contacto?.telefono || "—"}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-start">
                    <Badge size="sm" color={c.activo ? "success" : "error"}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-start">
                    <div className="flex gap-2">
                      <button
                        onClick={() => nav(`/admin/contratistas/${c.id}`)}
                        className="px-2 py-1 text-xs rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                        title="Ver"
                      >
                        Ver
                      </button>
                        <button
                        onClick={() =>
                            nav(`/admin/contratistas/${c.id}/editar`, {
                            state: { branchId: c.branchId }, // ✅ usar el branch del contratista
                            })
                        }
                        className="px-2 py-1 text-xs rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                        title="Editar"
                        >
                        Editar
                        </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
