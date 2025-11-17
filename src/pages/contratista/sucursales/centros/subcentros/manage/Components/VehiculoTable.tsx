// src/pages/contratista/vehiculos/VehiculosTable.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../../../../../components/ui/table";
import Badge from "../../../../../../../components/ui/badge/Badge";

// services
import {
  listVehiculos,
  type VehiculoRow,
} from "../../../../../../../services/vehiculos.service";

const HEADERS = [
  "Vehículo",
  "Subcentro",
  "Capacidad tanque (gal)",
  "Consumo (L/100km)",
  "Estado",
  "Acciones",
];

export default function VehiculosTable() {
  const nav = useNavigate();

  // Ruta:
  // /c/:branchId/:contractorId/centros/:centroId/subcentros/:subcentroId/vehiculos
  const { branchId = "", contractorId = "", centroId = "", subcentroId = "" } =
    useParams<{
      branchId: string;
      contractorId: string;
      centroId: string;
      subcentroId: string;
    }>();

  const [rows, setRows] = useState<VehiculoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const baseList = await listVehiculos(
        branchId,
        contractorId,
        centroId,
        subcentroId
      );

      const list: VehiculoRow[] = baseList.map((v: any) => ({
        id: v.id,
        sucursal_id: v.sucursal_id,
        centro_id: v.centro_id,
        subcentro_id: v.subcentro_id,
        contratista_id: v.contratista_id,
        tipo_equipo_id: v.tipo_equipo_id,
        capacidad_tanque_gal: v.capacidad_tanque_gal,
        consumo_l100km: v.consumo_l100km,
        activo: v.activo ?? true,

        // opcionales
        subcentroNombre: v.subcentroNombre,
        contractorNombre: v.contractorNombre,
        sucursalNombre: v.sucursalNombre,
      }));

      list.sort((a, b) =>
        (a.tipo_equipo_id || "").localeCompare(b.tipo_equipo_id || "")
      );

      setRows(list);
    } catch (e: any) {
      setErr("No se pudieron cargar los vehículos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [branchId, contractorId, centroId, subcentroId]);

  // Navegación corregida
  const handleView = (row: VehiculoRow) => {
    nav(
      `/c/${branchId}/${contractorId}/centros/${centroId}/subcentros/${subcentroId}/vehiculos/${row.id}`
    );
  };

  const handleEdit = (row: VehiculoRow) => {
    nav(
      `/c/${branchId}/${contractorId}/centros/${centroId}/subcentros/${subcentroId}/vehiculos/${row.id}/editar`
    );
  };

  // BOTÓN NUEVO VEHÍCULO — CORREGIDO
  const handleCreate = () => {
    nav(
      `/c/${branchId}/${contractorId}/centros/${centroId}/subcentros/${subcentroId}/vehiculos/nuevo`
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Vehículos asignados a este subcentro.
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center h-10 px-3 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600"
        >
          + Nuevo vehículo
        </button>
      </div>

      {/* Tabla */}
      <div className="max-w-full overflow-x-auto">
        <Table className="min-w-[880px]">
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
                <TableCell colSpan={HEADERS.length} className="px-4 py-4">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : err ? (
              <TableRow>
                <TableCell
                  colSpan={HEADERS.length}
                  className="px-4 py-4 text-red-600"
                >
                  {err}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={HEADERS.length}
                  className="px-4 py-4 text-gray-500"
                >
                  No hay vehículos registrados.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((v) => {
                const displayName =
                  v.tipo_equipo_id || v.subcentroNombre || v.id || "Vehículo";
                const initials = displayName.slice(0, 2).toUpperCase();

                return (
                  <TableRow key={v.id}>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 grid place-items-center text-xs text-gray-500">
                          {initials}
                        </div>

                        <div>
                          <span className="block text-sm font-medium text-gray-800 dark:text-white">
                            {v.tipo_equipo_id}
                          </span>

                          {v.contractorNombre && (
                            <span className="block text-xs text-gray-500">
                              Contratista: {v.contractorNombre}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      {v.subcentroNombre}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      {v.capacidad_tanque_gal}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      {v.consumo_l100km}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <Badge size="sm" color={v.activo ? "success" : "error"}>
                        {v.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleView(v)}
                          className="px-2 py-1 text-xs border rounded-lg"
                        >
                          Ver
                        </button>

                        <button
                          onClick={() => handleEdit(v)}
                          className="px-2 py-1 text-xs border rounded-lg"
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
