// src/pages/admin/sucursales/SucursalesTable.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShootingStarIcon, PencilIcon } from "../../../../icons";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../../../components/ui/table";
import {
  fetchSucursalesPage,
  type SucursalRow,
} from "../../../../services/sucursales.paging.service";

const HEADERS = ["Sucursal", "Departamento", "Municipio", "Estado", "Acciones"];

export default function SucursalesTable() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<SucursalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Paginación por cursores
  const [history, setHistory] = useState<Array<string | undefined>>([undefined]);
  const [cursorIdx, setCursorIdx] = useState(0);
  const nextKeyRef = useRef<string | undefined>(undefined);

  async function loadPage(startKey: string | undefined) {
    setLoading(true);
    try {
      const { rows, nextStartKey } = await fetchSucursalesPage(startKey);
      setRows(rows);
      nextKeyRef.current = nextStartKey;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(history[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.departamento.toLowerCase().includes(q) ||
        r.municipio.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const canGoPrev = cursorIdx > 0;
  const canGoNext = !!nextKeyRef.current;

  const goPrev = () => {
    if (!canGoPrev) return;
    const newIdx = cursorIdx - 1;
    setCursorIdx(newIdx);
    loadPage(history[newIdx]);
  };

  const goNext = () => {
    if (!canGoNext) return;
    const nextKey = nextKeyRef.current!;
    const newHistory = history.slice(0, cursorIdx + 1);
    newHistory.push(nextKey);
    setHistory(newHistory);
    const newIdx = cursorIdx + 1;
    setCursorIdx(newIdx);
    loadPage(nextKey);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-200 md:flex-row md:items-center md:justify-between dark:border-gray-800">
        <div>
          <h3 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">Sucursales</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administra y edita las sedes de la empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <ShootingStarIcon className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              className="w-72 h-10 pl-9 pr-3 text-sm bg-white border rounded-lg outline-none border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => navigate("/admin/sucursales/nueva")}
            className="inline-flex items-center h-10 px-3 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600"
          >
            + Nueva sucursal
          </button>
        </div>
      </div>

      {/* Table */}
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
                <TableCell className="px-4 py-4 text-sm text-gray-500" colSpan={HEADERS.length}>
                  Cargando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-4 text-sm text-gray-500" colSpan={HEADERS.length}>
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className="odd:bg-white even:bg-gray-50/50 dark:odd:bg-transparent dark:even:bg-white/[0.02] border-t border-gray-100 dark:border-gray-800"
                >
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                    {r.nombre}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">{r.departamento}</TableCell>
                  <TableCell className="px-4 py-3 text-sm">{r.municipio}</TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.activa
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.activa ? "bg-green-600" : "bg-red-600"
                        }`}
                      />
                      {r.activa ? "Activa" : "Inactiva"}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {/* Gestionar (tabs de la sucursal) */}
                      <button
                        onClick={() => navigate(`/admin/sucursales/${r.id}/gestionar`)}
                        className="
                          inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold
                          rounded-lg border border-brand-600 bg-brand-600 text-white
                          hover:bg-brand-700 hover:border-brand-700
                        "
                        title="Gestionar sucursal"
                      >
                        Gestionar
                      </button>

                      {/* Ver */}
                      <button
                        onClick={() => navigate(`/admin/sucursales/${r.id}`)}
                        className="inline-flex items-center gap-2 px-2 py-1 text-xs font-medium border rounded-lg border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                        title="Ver"
                      >
                        Ver
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => navigate(`/admin/sucursales/${r.id}/editar`)}
                        className="inline-flex items-center gap-2 px-2 py-1 text-xs font-medium border rounded-lg border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg白/5"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
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

      {/* Footer / Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          className="px-3 py-2 text-sm border rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-white/5"
          disabled={!canGoPrev || loading}
          onClick={goPrev}
        >
          Anterior
        </button>

        <span className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? "—" : `Mostrando ${filtered.length} registro(s)`}
        </span>

        <button
          className="px-3 py-2 text-sm border rounded-lg border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-white/5"
          disabled={!canGoNext || loading}
          onClick={goNext}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
