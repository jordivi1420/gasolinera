// src/pages/admin/sucursales/centros/subcentros/SubcentrosAdminPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listSubcentros,
  type Subcentro,
} from "../../../../../services/subcentros.service";
import {
  listCentros,
  type Centro,
} from "../../../../../services/centros.service";
import { getContratista } from "../../../../../services/contratistas.service";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../../../../components/ui/table";
import { ShootingStarIcon } from "../../../../../icons";

const HEADERS = ["Subcentro", "Código", "Estado", "Acciones"];

export default function SubcentrosAdminPage() {
  const navigate = useNavigate();

  // Ruta: /admin/sucursales/:sucursalId/contratistas/:contractorId/centros/:centroId/subcentros
  const { sucursalId = "", contractorId = "", centroId = "" } = useParams<{
    sucursalId: string;
    contractorId: string;
    centroId: string;
  }>();

  const [rows, setRows] = useState<Subcentro[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Nombres “bonitos”
  const [contractorName, setContractorName] = useState<string>("");
  const [centroName, setCentroName] = useState<string>("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      if (!sucursalId || !contractorId || !centroId) {
        throw new Error(
          "Faltan parámetros: sucursal, contratista o centro no definidos."
        );
      }

      const [subcentros, contratista, centros] = await Promise.all([
        listSubcentros(sucursalId, contractorId, centroId),
        getContratista(sucursalId, contractorId),
        listCentros(sucursalId, contractorId),
      ]);

      setRows(subcentros);

      // Nombre del contratista
      setContractorName(contratista?.nombre ?? contractorId);

      // Nombre del centro
      const centro = (centros as Centro[]).find((c) => c.id === centroId);
      setCentroName(centro?.nombre ?? centroId);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "No se pudieron cargar los subcentros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!sucursalId || !contractorId || !centroId) {
      setLoading(false);
      setErr("Parámetros incompletos en la URL.");
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalId, contractorId, centroId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const nombre = r.nombre?.toLowerCase() ?? "";
      const codigo = r.codigo?.toLowerCase() ?? "";
      return nombre.includes(q) || codigo.includes(q);
    });
  }, [rows, search]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-200 md:flex-row md:items-center md:justify-between dark:border-gray-800">
        <div className="space-y-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
            title="Volver"
          >
            <span className="inline-block h-3 w-3 rotate-180 border-l-2 border-b-2 border-current" />
            Volver
          </button>

          <div>
            <h3 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
              Subcentros del centro
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sucursal: <b>{sucursalId}</b> · Contratista:{" "}
              <b>{contractorName || contractorId}</b> · Centro:{" "}
              <b>{centroName || centroId}</b>
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
                      {/* aquí luego puedes agregar acciones de admin (editar, desactivar, etc.) */}
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
