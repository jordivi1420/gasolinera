// src/services/vehiculos.service.ts

import {
  ref,
  get,
  set,
  push,
  update,
  remove,
} from "firebase/database";
import { rtdb } from "../config/firebase";

/**
 * Estructura de un vehículo en RTDB
 * Ruta:
 * branches/{branchId}/contractors/{contractorId}/centros/{centroId}/subcentros/{subcentroId}/vehiculos/{vehiculoId}
 */
export interface Vehiculo {
  id: string;

  sucursal_id: string;    // branchId
  contratista_id: string; // contractorId
  centro_id: string;      // centroId
  subcentro_id: string;   // subcentroId

  tipo_equipo_id: string;

  capacidad_tanque_gal: number;
  consumo_l100km: number;

  activo: boolean;

  creado_por?: string;
  actualizado_por?: string;
  creado_en?: number;
  actualizado_en?: number;
}

export type VehiculoCreateInput = {
  tipo_equipo_id: string;
  capacidad_tanque_gal: number;
  consumo_l100km: number;
  activo?: boolean;
  creado_por?: string;
};

export type VehiculoUpdateInput = {
  tipo_equipo_id?: string;
  capacidad_tanque_gal?: number;
  consumo_l100km?: number;
  activo?: boolean;
  actualizado_por?: string;
};

export type VehiculoRow = Vehiculo & {
  contractorNombre?: string;
  sucursalNombre?: string;
  subcentroNombre?: string;
};

function vehiculosPath(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string
) {
  return `branches/${branchId}/contractors/${contractorId}/centros/${centroId}/subcentros/${subcentroId}/vehiculos`;
}

/* ============================
   LISTAR VEHÍCULOS
============================ */
export async function listVehiculos(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string
): Promise<Vehiculo[]> {
  const snap = await get(
    ref(rtdb, vehiculosPath(branchId, contractorId, centroId, subcentroId))
  );
  if (!snap.exists()) return [];

  const raw = snap.val() as Record<string, any>;

  return Object.entries(raw).map(([id, v]) => ({
    id,
    sucursal_id: v.sucursal_id ?? branchId,
    contratista_id: v.contratista_id ?? contractorId,
    centro_id: v.centro_id ?? centroId,
    subcentro_id: v.subcentro_id ?? subcentroId,
    tipo_equipo_id: v.tipo_equipo_id,
    capacidad_tanque_gal: Number(v.capacidad_tanque_gal ?? 0),
    consumo_l100km: Number(v.consumo_l100km ?? 0),
    activo: v.activo ?? true,
    creado_por: v.creado_por,
    actualizado_por: v.actualizado_por,
    creado_en: v.creado_en,
    actualizado_en: v.actualizado_en,
  }));
}

/* ============================
   GET VEHÍCULO (NUEVO)
============================ */
export async function getVehiculo(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string,
  vehiculoId: string
): Promise<Vehiculo | null> {
  const snap = await get(
    ref(
      rtdb,
      `${vehiculosPath(
        branchId,
        contractorId,
        centroId,
        subcentroId
      )}/${vehiculoId}`
    )
  );

  if (!snap.exists()) return null;

  const v = snap.val();

  return {
    id: vehiculoId,
    sucursal_id: branchId,
    contratista_id: contractorId,
    centro_id: centroId,
    subcentro_id: subcentroId,
    tipo_equipo_id: v.tipo_equipo_id,
    capacidad_tanque_gal: Number(v.capacidad_tanque_gal ?? 0),
    consumo_l100km: Number(v.consumo_l100km ?? 0),
    activo: v.activo ?? true,
    creado_por: v.creado_por,
    actualizado_por: v.actualizado_por,
    creado_en: v.creado_en,
    actualizado_en: v.actualizado_en,
  };
}

/* ============================
   CREAR VEHÍCULO
============================ */
export async function createVehiculo(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string,
  data: VehiculoCreateInput
): Promise<string> {
  const baseRef = ref(
    rtdb,
    vehiculosPath(branchId, contractorId, centroId, subcentroId)
  );
  const newRef = push(baseRef);
  const id = newRef.key!;
  const now = Date.now();

  await set(newRef, {
    sucursal_id: branchId,
    contratista_id: contractorId,
    centro_id: centroId,
    subcentro_id: subcentroId,

    tipo_equipo_id: data.tipo_equipo_id,
    capacidad_tanque_gal: data.capacidad_tanque_gal,
    consumo_l100km: data.consumo_l100km,

    activo: data.activo ?? true,
    creado_por: data.creado_por ?? "contractor-ui",
    creado_en: now,
    actualizado_en: now,
  });

  return id;
}

/* ============================
   ACTUALIZAR VEHÍCULO
============================ */
export async function updateVehiculo(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string,
  vehiculoId: string,
  data: VehiculoUpdateInput
): Promise<void> {
  const now = Date.now();

  await update(
    ref(
      rtdb,
      `${vehiculosPath(
        branchId,
        contractorId,
        centroId,
        subcentroId
      )}/${vehiculoId}`
    ),
    {
      ...data,
      actualizado_en: now,
    }
  );
}

/* ============================
   ACTIVAR / DESACTIVAR
============================ */
export async function toggleVehiculoActivo(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string,
  vehiculoId: string,
  activo: boolean,
  userId: string
): Promise<void> {
  await updateVehiculo(
    branchId,
    contractorId,
    centroId,
    subcentroId,
    vehiculoId,
    {
      activo,
      actualizado_por: userId,
    }
  );
}

/* ============================
   ELIMINAR VEHÍCULO
============================ */
export async function deleteVehiculo(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string,
  vehiculoId: string
): Promise<void> {
  await remove(
    ref(
      rtdb,
      `${vehiculosPath(
        branchId,
        contractorId,
        centroId,
        subcentroId
      )}/${vehiculoId}`
    )
  );
}

/* =====================================================
   LISTAR TODOS LOS VEHÍCULOS DE UNA SUCURSAL (ADMIN)
===================================================== */
export async function listVehiculosByBranch(
  branchId: string
): Promise<VehiculoRow[]> {
  const snap = await get(ref(rtdb, `branches/${branchId}/contractors`));
  if (!snap.exists()) return [];

  const raw = snap.val() as Record<string, any>;
  const rows: VehiculoRow[] = [];

  for (const [contractorId, contractorData] of Object.entries(raw)) {
    const contractorNombre =
      (contractorData as any).nombre ||
      (contractorData as any).name ||
      undefined;

    const centros = (contractorData as any).centros || {};
    for (const [centroId, centroData] of Object.entries(centros)) {
      const subcentros = (centroData as any).subcentros || {};

      for (const [subcentroId, subcentroData] of Object.entries(subcentros)) {
        const subcentroNombre =
          (subcentroData as any).nombre ||
          (subcentroData as any).name ||
          undefined;

        const vehiculos = (subcentroData as any).vehiculos || {};

        for (const [vehiculoId, v] of Object.entries(
          vehiculos as Record<string, any>
        )) {
          rows.push({
            id: vehiculoId,

            sucursal_id: branchId,
            contratista_id: contractorId,
            centro_id: centroId,
            subcentro_id: subcentroId,

            tipo_equipo_id: (v as any).tipo_equipo_id,
            capacidad_tanque_gal: Number(
              (v as any).capacidad_tanque_gal ?? 0
            ),
            consumo_l100km: Number(
              (v as any).consumo_l100km ?? 0
            ),
            activo: (v as any).activo ?? true,

            creado_por: (v as any).creado_por,
            actualizado_por: (v as any).actualizado_por,
            creado_en: (v as any).creado_en,
            actualizado_en: (v as any).actualizado_en,

            contractorNombre,
            subcentroNombre,
          });
        }
      }
    }
  }

  return rows;
}
