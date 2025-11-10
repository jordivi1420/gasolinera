// src/pages/admin/sucursales/manage/ContratistasPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  listContratistasByBranch,
  toggleContratistaActivo,
  removeContratistaFromBranchClean,
  type ContratistaRow,
  listAllContratistasUnified,
  getContratistaFromAnyBranch,
  createContratista,
  type Contractor,
} from "../../../../services/contratistas.service";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../../../components/ui/table";

import DropdownSearchSelect, { DropdownItem } from "./DropdownSearchSelect";
import { ShootingStarIcon } from "../../../../icons";
import { useAuth } from "../../../../context/AuthContext";

const HEADERS = ["Contratista", "NIT", "Contacto", "Teléfono", "Estado", "Acciones"];

export default function ContratistasPage() {
  const { sucursalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rows, setRows] = useState<ContratistaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Candidatos disponibles (no asignados a esta sucursal)
  const [candidates, setCandidates] = useState<DropdownItem[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  async function loadRows() {
    if (!sucursalId) return;
    setLoading(true);
    try {
      const data = await listContratistasByBranch(sucursalId);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadCandidates() {
    if (!sucursalId) return;
    setLoadingCandidates(true);
    try {
      const all = await listAllContratistasUnified();
      // disponibles = los que NO tienen esta sucursal en branchIds
      const available = all.filter((c: any) => !(c.branchIds || []).includes(sucursalId));
      const mapped: DropdownItem[] = available.map((c: any) => ({
        value: c.id,
        label: c.nombre || c.id,
        hint: c.contacto?.email || c.nit || "",
        meta: c,
      }));
      mapped.sort((a, b) => a.label.localeCompare(b.label));
      setCandidates(mapped);
    } finally {
      setLoadingCandidates(false);
    }
  }

  useEffect(() => {
    loadRows();
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalId]);

  async function onToggle(id: string, activo: boolean) {
    if (!sucursalId) return;
    await toggleContratistaActivo(sucursalId, id, !activo, user?.uid || "admin-ui");
    await loadRows();
  }

  async function onRemove(id: string) {
    if (!sucursalId) return;
    const ok = confirm(
      "¿Quitar este contratista de la sucursal? Se limpiarán referencias y, si queda sin sucursales, pasará a 'pendientes'."
    );
    if (!ok) return;
    await removeContratistaFromBranchClean(sucursalId, id);
    await Promise.all([loadRows(), loadCandidates()]);
  }

  // Agregar desde Dropdown
  async function onAddContractor(value: string, item: DropdownItem) {
    if (!sucursalId) return;

    // Intentar obtener datos base desde cualquier sucursal donde exista
    const { data: sample } = await getContratistaFromAnyBranch(value);

    const base: Partial<Contractor> =
      sample ??
      (item.meta as Partial<Contractor>) ??
      ({
        nombre: item.label,
        nit: "",
        activo: true,
        contacto: { email: item.hint || "" },
      } as Partial<Contractor>);

    await createContratista(sucursalId, {
      id: value,
      nombre: base.nombre || item.label,
      nit: base.nit || "",
      activo: base.activo ?? true,
      contacto: {
        nombre: base.contacto?.nombre || "",
        telefono: base.contacto?.telefono || "",
        email: base.contacto?.email || item.hint || "",
      },
      creado_por: user?.uid || "admin-ui",
      admin_uid: (base as any)?.admin_uid, // preserva admin_uid si viene del sample
    } as any);

    await Promise.all([loadRows(), loadCandidates()]);
  }

  // Ir a gestionar centros del contratista (en el layout de la sucursal)


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const nombre = r.nombre?.toLowerCase() ?? "";
      const nit = r.nit?.toLowerCase() ?? "";
      const contacto = r.contacto?.nombre?.toLowerCase() ?? "";
      const email = r.contacto?.email?.toLowerCase() ?? "";
      const tel = r.contacto?.telefono?.toLowerCase() ?? "";
      return (
        nombre.includes(q) ||
        nit.includes(q) ||
        contacto.includes(q) ||
        email.includes(q) ||
        tel.includes(q)
      );
    });
  }, [rows, search]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-200 md:flex-row md:items-center md:justify-between dark:border-gray-800">
        <div>
          <h3 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
            Contratistas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administra los contratistas asignados a esta sucursal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <ShootingStarIcon className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              className="w-72 h-10 pl-9 pr-3 text-sm bg-white border rounded-lg outline-none border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
              placeholder="Buscar por nombre, NIT, contacto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DropdownSearchSelect
            items={candidates}
            onSelect={onAddContractor}
            triggerText={loadingCandidates ? "Cargando…" : "+ Agregar contratista"}
            disabled={loadingCandidates || !candidates.length}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table className="min-w-[920px]">
          <TableHeader className="text-xs uppercase bg-gray-50 dark:bg-white/5 dark:text-gray-400 sticky top-0 z-10">
            <TableRow>
              {HEADERS.map((h) => (
                <TableCell key={h} isHeader className="px-4 py-3">
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="px-4 py-4 text-sm text-gray-500" colSpan={HEADERS.length}>
                  Cargando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-4 text-sm text-gray-500" colSpan={HEADERS.length}>
                  Sin contratistas
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className="odd:bg-white even:bg-gray-50/50 dark:odd:bg-transparent dark:even:bg-white/[0.02] border-t border-gray-100 dark:border-gray-800"
                >
                  {/* Contratista */}
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                    {r.nombre}
                    <div className="text-xs text-gray-500">ID: {r.id}</div>
                  </TableCell>

                  {/* NIT */}
                  <TableCell className="px-4 py-3 text-sm">
                    {r.nit || <span className="text-gray-400">—</span>}
                  </TableCell>

                  {/* Contacto */}
                  <TableCell className="px-4 py-3 text-sm">
                    {r.contacto?.nombre || <span className="text-gray-400">—</span>}
                    {r.contacto?.email && (
                      <div className="text-xs text-gray-500">{r.contacto.email}</div>
                    )}
                  </TableCell>

                  {/* Teléfono */}
                  <TableCell className="px-4 py-3 text-sm">
                    {r.contacto?.telefono || <span className="text-gray-400">—</span>}
                  </TableCell>

                  {/* Estado */}
                  <TableCell className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.activo
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.activo ? "bg-green-600" : "bg-red-600"
                        }`}
                      />
                      {r.activo ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onToggle(r.id, r.activo)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                          r.activo
                            ? "border-amber-600 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                            : "border-emerald-600 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        }`}
                        title={r.activo ? "Desactivar" : "Activar"}
                      >
                        {r.activo ? "Desactivar" : "Activar"}
                      </button>

                      <button
                        // En tu ContratistasPage o ContractorsTable donde está el botón Gestionar:
                        onClick={() => navigate(`/admin/sucursales/${sucursalId}/contratistas/${r.id}/centros`)}

                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-brand-600 bg-brand-600 text-white hover:bg-brand-700 hover:border-brand-700"
                        title="Gestionar centros del contratista"
                      >
                        Gestionar
                      </button>

                      <button
                        onClick={() => onRemove(r.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-600 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                        title="Quitar de sucursal"
                      >
                        Quitar
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
