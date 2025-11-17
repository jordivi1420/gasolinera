// src/pages/contratista/sucursales/centros/CentrosPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  listCentros,
  type Centro,
  createCentro,
  updateCentro,
  toggleCentroActivo,
} from "../../../../services/centros.service";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../../../components/ui/table";

import Button from "../../../../components/ui/button/Button";
import CentroFormModal from "./CentroFormModal";
import { ShootingStarIcon } from "../../../../icons";

export default function CentrosContratistaPage() {
  const navigate = useNavigate();
  // Ruta: /c/:branchId/:contractorId/centros
  const {
    branchId = "",
    contractorId: contractorKey = "",
  } = useParams<{ branchId: string; contractorId: string }>();

  const { profile, user } = useAuth() as any;

  const contractorRtdbId: string =
    (profile as any)?.contractorId || contractorKey || user?.uid || "";

  const [rows, setRows] = useState<Centro[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [contractorName, setContractorName] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Centro | null>(null);

  const HEADERS = ["Centro", "Código", "Descripción", "Estado", "Acciones"];

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      if (!branchId || !contractorRtdbId) {
        throw new Error(
          "No se pudo determinar el contratista asociado a tu usuario."
        );
      }

      const centros = await listCentros(branchId, contractorRtdbId);
      setRows(centros);

      setContractorName(
        profile?.name ||
          profile?.displayName ||
          profile?.email ||
          contractorRtdbId
      );
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "No se pudieron cargar los centros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!branchId || !contractorRtdbId) {
      setLoading(false);
      if (!contractorRtdbId) {
        setErr(
          "No se pudo determinar el contratista. Revisa que el enlace /c/:branchId/:contractorId sea correcto o pide al admin que revise tu usuario."
        );
      }
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, contractorRtdbId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const nombre = r.nombre?.toLowerCase() ?? "";
      const codigo = r.codigo?.toLowerCase() ?? "";
      const desc = r.descripcion?.toLowerCase() ?? "";
      return nombre.includes(q) || codigo.includes(q) || desc.includes(q);
    });
  }, [rows, search]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(c: Centro) {
    setEditing(c);
    setOpen(true);
  }

  async function handleSave(values: {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    activo: boolean;
  }) {
    if (!branchId || !contractorRtdbId) {
      throw new Error("Ruta inválida (falta sucursal o contratista).");
    }
    if (!user?.uid) {
      throw new Error("No has iniciado sesión.");
    }

    if (!editing) {
      await createCentro(branchId, contractorRtdbId, {
        nombre: values.nombre,
        codigo: values.codigo,
        descripcion: values.descripcion,
        activo: values.activo,
        creado_por: user.uid,
      });
    } else {
      await updateCentro(branchId, contractorRtdbId, editing.id, {
        nombre: values.nombre,
        codigo: values.codigo,
        descripcion: values.descripcion,
        activo: values.activo,
        actualizado_por: user.uid,
      });
    }

    setOpen(false);
    await load();
  }

  async function handleToggle(c: Centro) {
    if (!branchId || !contractorRtdbId) return;
    await toggleCentroActivo(
      branchId,
      contractorRtdbId,
      c.id,
      !c.activo,
      user?.uid || "contractor-ui"
    );
    await load();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-200 md:flex-row md:items-center md:justify-between dark:border-gray-800">
        <div className="space-y-2">
          {/* Botón volver a sucursales */}
          <button
            onClick={() => navigate(`/c/${branchId}/${contractorRtdbId}/sucursales`)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            title="Volver a la sucursal"
          >
            <span className="inline-block h-3 w-3 rotate-180 border-l-2 border-b-2 border-current" />
            Volver
          </button>

          <div>
            <h3 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
              Centros del contratista
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sucursal: <b>{branchId}</b> · Contratista: <b>{contractorName}</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <ShootingStarIcon className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              className="w-72 h-10 pl-9 pr-3 text-sm bg-white border rounded-lg outline-none border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
              placeholder="Buscar por nombre, código o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button onClick={openCreate} className="h-10 px-3 text-sm font-medium">
            + Nuevo centro
          </Button>
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
                  Sin centros
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="odd:bg-white even:bg-gray-50/50 dark:odd:bg-transparent dark:even:bg-white/[0.02] border-t border-gray-100 dark:border-gray-800"
                >
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                    {c.nombre}
                    <div className="text-xs text-gray-800 dark:text-white/90">
                      ID: {c.id}
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                    {c.codigo || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                    {c.descripcion || "—"}
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                        c.activo
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          c.activo ? "bg-green-600" : "bg-red-600"
                        }`}
                      />
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">

                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5 text-gray-800 dark:text-white/90"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggle(c)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                          c.activo
                            ? "border-amber-600 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                            : "border-emerald-600 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        }`}
                        title={c.activo ? "Desactivar" : "Activar"}
                      >
                        {c.activo ? "Desactivar" : "Activar"}
                      </button>
                                            <button
                        onClick={() =>
                          navigate(
                            `/c/${branchId}/${contractorRtdbId}/centros/${c.id}/subcentros`
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-brand-600 bg-brand-600 text-white hover:bg-brand-700 hover:border-brand-700"
                        title="Gestionar subcentros"
                      >
                        Subcentros
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
        initial={editing || undefined}
        onSave={handleSave}
      />
    </div>
  );
}
