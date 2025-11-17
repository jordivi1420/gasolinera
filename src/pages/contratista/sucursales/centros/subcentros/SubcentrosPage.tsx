// src/pages/contratista/sucursales/centros/subcentros/SubcentrosContratistaPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext";

import {
  listSubcentros,
  type Subcentro,
  createSubcentro,
  updateSubcentro,
  toggleSubcentroActivo,
} from "../../../../../services/subcentros.service";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../../../../components/ui/table";

import Button from "../../../../../components/ui/button/Button";
import CentroFormModal from "./CentroFormModal"; // reutilizamos el mismo modal
import { ShootingStarIcon } from "../../../../../icons";

export default function SubcentrosContratistaPage() {
  const navigate = useNavigate();

  // Ruta: /c/:branchId/:contractorId/centros/:centroId/subcentros
  const {
    branchId = "",
    contractorId: contractorKey = "",
    centroId = "",
  } = useParams<{
    branchId: string;
    contractorId: string;
    centroId: string;
  }>();

  const { profile, user } = useAuth() as any;

  const contractorRtdbId: string =
    (profile as any)?.contractorId || contractorKey || user?.uid || "";

  const [rows, setRows] = useState<Subcentro[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [contractorName, setContractorName] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subcentro | null>(null);

  const HEADERS = ["Subcentro", "Código", "Estado", "Acciones"];

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      if (!branchId || !contractorRtdbId || !centroId) {
        throw new Error(
          "No se pudo determinar el subcentro (falta sucursal, contratista o centro)."
        );
      }

      const subcentros = await listSubcentros(
        branchId,
        contractorRtdbId,
        centroId
      );
      setRows(subcentros);

      setContractorName(
        profile?.name ||
          profile?.displayName ||
          profile?.email ||
          contractorRtdbId
      );
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "No se pudieron cargar los subcentros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!branchId || !contractorRtdbId || !centroId) {
      setLoading(false);
      if (!contractorRtdbId) {
        setErr(
          "No se pudo determinar el contratista. Revisa el enlace o pide al admin que revise tu usuario."
        );
      }
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, contractorRtdbId, centroId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const nombre = r.nombre?.toLowerCase() ?? "";
      const codigo = r.codigo?.toLowerCase() ?? "";
      return nombre.includes(q) || codigo.includes(q);
    });
  }, [rows, search]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(s: Subcentro) {
    setEditing(s);
    setOpen(true);
  }

  async function handleSave(values: {
    nombre: string;
    codigo?: string;
    activo: boolean;
  }) {
    if (!branchId || !contractorRtdbId || !centroId) {
      throw new Error("Ruta inválida (falta sucursal, contratista o centro).");
    }
    if (!user?.uid) {
      throw new Error("No has iniciado sesión.");
    }

    if (!editing) {
      await createSubcentro(branchId, contractorRtdbId, centroId, {
        nombre: values.nombre,
        codigo: values.codigo,
        activo: values.activo,
        creado_por: user.uid,
      });
    } else {
      await updateSubcentro(
        branchId,
        contractorRtdbId,
        centroId,
        editing.id,
        {
          nombre: values.nombre,
          codigo: values.codigo,
          activo: values.activo,
          actualizado_por: user.uid,
        }
      );
    }

    setOpen(false);
    await load();
  }

  async function handleToggle(s: Subcentro) {
    if (!branchId || !contractorRtdbId || !centroId) return;
    await toggleSubcentroActivo(
      branchId,
      contractorRtdbId,
      centroId,
      s.id,
      !s.activo,
      user?.uid || "contractor-ui"
    );
    await load();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-200 md:flex-row md:items-center md:justify-between dark:border-gray-800">
        <div className="space-y-2">
          {/* Botón volver con mismo estilo que usamos en Centros */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            title="Volver a la sucursal"
          >
            <span className="inline-block h-3 w-3 rotate-180 border-l-2 border-b-2 border-current" />
            Volver
          </button>

          <div>
            <h3 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
              Subcentros
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sucursal: <b>{branchId}</b> · Contratista: <b>{contractorName}</b>{" "}
              · Centro: <b>{centroId}</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <ShootingStarIcon className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              className="w-72 h-10 pl-9 pr-3 text-sm bg-white border rounded-lg outline-none border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
              placeholder="Buscar por nombre o código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button onClick={openCreate} className="h-10 px-3 text-sm font-medium">
            + Nuevo subcentro
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table className="min-w-[720px]">
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
                <TableCell
                  className="px-4 py-4 text-sm text-gray-500"
                  colSpan={HEADERS.length}
                >
                  Cargando…
                </TableCell>
              </TableRow>
            ) : err ? (
              <TableRow>
                <TableCell
                  className="px-4 py-4 text-sm text-red-600"
                  colSpan={HEADERS.length}
                >
                  {err}
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  className="px-4 py-4 text-sm text-gray-500"
                  colSpan={HEADERS.length}
                >
                  Sin subcentros
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="odd:bg-white even:bg-gray-50/50 dark:odd:bg-transparent dark:even:bg-white/[0.02] border-t border-gray-100 dark:border-gray-800"
                >
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                    {s.nombre}
                    <div className="text-xs text-gray-800 dark:text-white/90">
                      ID: {s.id}
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                    {s.codigo || "—"}
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                        s.activo
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          s.activo ? "bg-green-600" : "bg-red-600"
                        }`}
                      />
                      {s.activo ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5 text-gray-800 dark:text-white/90"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggle(s)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                          s.activo
                            ? "border-amber-600 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                            : "border-emerald-600 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        }`}
                        title={s.activo ? "Desactivar" : "Activar"}
                      >
                        {s.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/c/${branchId}/${contractorRtdbId}/centros/${centroId}/subcentros/${s.id}/manage`
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-brand-600 bg-brand-600 text-white hover:bg-brand-700 hover:border-brand-700"
                        title="Gestionar subcentro"
                      >
                        Gestionar
                      </button>


                      
                      
                  
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CentroFormModal
        open={open}
        onClose={() => setOpen(false)}
        initial={
          editing
            ? {
                nombre: editing.nombre,
                codigo: editing.codigo,
                activo: editing.activo,
              }
            : undefined
        }
        onSave={handleSave}
      />
    </div>
  );
}
