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
  listAllContratistasUnified,
  listContratistasByBranch,
  type ContratistaRow,
  type ContratistaUnifiedRow,
} from "../../../../services/contratistas.service";

type SucursalOpt = { value: string; label: string };

// Tipo unificado para render (filtrado por sucursal vs unificado)
type RowAll =
  | (ContratistaUnifiedRow & { isOrphan?: false })
  | (ContratistaRow & { isOrphan?: false })
  | ({
      // huérfano proveniente de listAllContratistasUnified()
      id: string;
      nombre: string;
      nit?: string;
      contacto?: { nombre?: string; telefono?: string; email?: string };
      activo: boolean;
      creado_en: number;
      creado_por: string;
      actualizado_en?: number;
      actualizado_por?: string;
      branchIds: string[];
      isOrphan: true;
    });

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

  const [rows, setRows] = useState<RowAll[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Sucursales para el select (admin global)
  const [sucursales, setSucursales] = useState<SucursalOpt[]>([]);

  // Cargar sucursales (solo admin global sin branchId de prop)
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
          // Vista unificada sin duplicados + incluye huérfanos (sin sucursal)
          const allUnified = await listAllContratistasUnified();
          const normalized: RowAll[] = allUnified.map((r: any) =>
            String(r.id).startsWith("auth-")
              ? { ...r, isOrphan: true }
              : { ...r, isOrphan: false }
          );
          setRows(normalized);
        } else {
          // Vista por sucursal puntual
          const list = await listContratistasByBranch(branchId);
          const sorted = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
          setRows(sorted as RowAll[]);
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

  // Handler flexible para tu Select
  const handleSucursalChange = (val: unknown) => {
    if (typeof val === "string") {
      setBranchId(val ? val : undefined);
      return;
    }
    if (val && typeof val === "object" && "value" in (val as any)) {
      const v = (val as any).value as string;
      setBranchId(v ? v : undefined);
      return;
    }
    setBranchId(undefined);
  };

  // Navegaciones
  const handleView = (row: RowAll) => {
    const isOrphan = (row as any).isOrphan === true;
    if (isOrphan) return; // sin detalle aún

    const bIds = (row as any).branchIds as string[] | undefined;

    if (!branchId && bIds && bIds.length > 0) {
      // sin filtro activo: usa primera sucursal (o podrías abrir modal para elegir)
      nav(`/admin/contratistas/${row.id}`, { state: { branchId: bIds[0] } });
      return;
    }

    if (branchId) {
      nav(`/admin/contratistas/${row.id}`, { state: { branchId } });
      return;
    }

    nav(`/admin/contratistas/${row.id}`);
  };

  const handleEdit = (row: RowAll) => {
    const isOrphan = (row as any).isOrphan === true;

    if (isOrphan) {
      // Mantiene botón "Editar" (como pediste), pero lleva al flujo de asignación/creación
      nav(`/admin/contratistas/nueva`, {
        state: { prefillName: row.nombre, prefillEmail: row.contacto?.email ?? "" },
      });
      return;
    }

    const bIds = (row as any).branchIds as string[] | undefined;

    if (!branchId && bIds && bIds.length > 1) {
      // Tiene varias sucursales; por simplicidad usamos la primera (puedes mejorar con modal)
      nav(`/admin/contratistas/${row.id}/editar`, { state: { branchId: bIds[0] } });
      return;
    }

    if (!branchId && bIds && bIds.length === 1) {
      nav(`/admin/contratistas/${row.id}/editar`, { state: { branchId: bIds[0] } });
      return;
    }

    if (branchId) {
      nav(`/admin/contratistas/${row.id}/editar`, { state: { branchId } });
      return;
    }

    nav(`/admin/contratistas/${row.id}/editar`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filtro de sucursal para admin global */}
      {isGlobalAdmin && !branchIdProp && (
        <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {branchId
              ? "Mostrando contratistas de la sucursal seleccionada"
              : "Mostrando todos los contratistas (unificados) y huérfanos sin sucursal."}
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-64">
              <Select
                key={branchId ?? "all"}         // remount al cambiar filtro
                options={sucursales}
                
                onChange={handleSucursalChange}
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
                    : "No hay contratistas ni huérfanos registrados."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c: RowAll) => {
                // key única (evita colisiones cuando hay filtro por sucursal)
                const rowKey = (c as any).branchId ? `${(c as any).branchId}:${c.id}` : c.id;
                const branchesInfo = (c as any).branchIds as string[] | undefined;
                const isOrphan = (c as any).isOrphan === true;

                return (
                  <TableRow key={rowKey}>
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

                          {!branchId && branchesInfo && (
                            <span className="inline-flex mt-1 items-center gap-2 rounded-full border px-2 py-0.5 text-[11px] text-gray-600 border-gray-200 dark:border-white/10 dark:text-gray-300">
                              {branchesInfo.length === 0
                                ? "Sin sucursal (huérfano)"
                                : branchesInfo.length === 1
                                ? "1 sucursal"
                                : `${branchesInfo.length} sucursales`}
                            </span>
                          )}
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
                      <Badge size="sm" color={isOrphan ? "warning" : c.activo ? "success" : "error"}>
                        {isOrphan ? "Pendiente" : c.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(c)}
                          disabled={isOrphan}
                          className="px-2 py-1 text-xs rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:pointer-events-none dark:border-gray-700 dark:hover:bg-white/5"
                          title={isOrphan ? "Sin detalle: aún no tiene sucursal" : "Ver"}
                        >
                          Ver
                        </button>

                        {/* ✅ Mantengo el botón de Editar */}
                        <button
                          onClick={() => handleEdit(c)}
                          className="px-2 py-1 text-xs rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                          title={isOrphan ? "Asignar a sucursal / completar registro" : "Editar"}
                        >
                          Editar
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
