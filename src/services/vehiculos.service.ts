// src/services/vehiculos.service.ts
import { ref, get, set, update, remove, push } from "firebase/database";
import { rtdb } from "../config/firebase";

export interface Vehiculo {
  id: string;
  sucursal_id: string;
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

function vehiculosPath(branchId: string) {
  return `branches/${branchId}/vehiculos`;
}

/* ============================
   LISTAR VEHÍCULOS POR SUCURSAL
============================= */
export async function listVehiculos(branchId: string): Promise<Vehiculo[]> {
  const snap = await get(ref(rtdb, vehiculosPath(branchId)));
  if (!snap.exists()) return [];

  const raw = snap.val() as Record<string, any>;

  return Object.entries(raw).map(([id, v]) => ({
    id,
    sucursal_id: branchId,
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
   GET VEHÍCULO
============================= */
export async function getVehiculo(branchId: string, vehiculoId: string) {
  const snap = await get(
    ref(rtdb, `${vehiculosPath(branchId)}/${vehiculoId}`)
  );

  if (!snap.exists()) return null;

  const v = snap.val();
  return {
    id: vehiculoId,
    sucursal_id: branchId,
    tipo_equipo_id: v.tipo_equipo_id,
    capacidad_tanque_gal: Number(v.capacidad_tanque_gal),
    consumo_l100km: Number(v.consumo_l100km),
    activo: v.activo ?? true,
    creado_por: v.creado_por,
    actualizado_por: v.actualizado_por,
    creado_en: v.creado_en,
    actualizado_en: v.actualizado_en,
  };
}

/* ============================
   CREAR VEHÍCULO
============================= */
export async function createVehiculo(branchId: string, data: VehiculoCreateInput) {
  const baseRef = ref(rtdb, vehiculosPath(branchId));
  const newRef = push(baseRef);
  const id = newRef.key!;
  const now = Date.now();

  await set(newRef, {
    sucursal_id: branchId,
    tipo_equipo_id: data.tipo_equipo_id,
    capacidad_tanque_gal: data.capacidad_tanque_gal,
    consumo_l100km: data.consumo_l100km,
    activo: data.activo ?? true,
    creado_por: data.creado_por,
    creado_en: now,
    actualizado_en: now,
  });

  return id;
}

/* ============================
   ACTUALIZAR
============================= */
export async function updateVehiculo(
  branchId: string,
  vehiculoId: string,
  data: VehiculoUpdateInput
) {
  const now = Date.now();

  await update(ref(rtdb, `${vehiculosPath(branchId)}/${vehiculoId}`), {
    ...data,
    actualizado_en: now,
  });
}

/* ============================
   ELIMINAR
============================= */
export async function deleteVehiculo(branchId: string, vehiculoId: string) {
  await remove(ref(rtdb, `${vehiculosPath(branchId)}/${vehiculoId}`));
}
