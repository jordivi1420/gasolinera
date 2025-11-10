// src/services/centros.service.ts
import { ref, get, set, update, remove, push } from "firebase/database";
import { rtdb } from "../config/firebase";

export type Centro = {
  id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  activo: boolean;
  creado_en: number;
  creado_por: string;
  actualizado_en?: number;
  actualizado_por?: string;
};

function basePath(branchId: string, contractorId: string) {
  return `branches/${branchId}/contractors/${contractorId}/centros`;
}

export async function listCentros(branchId: string, contractorId: string): Promise<Centro[]> {
  const snap = await get(ref(rtdb, basePath(branchId, contractorId)));
  if (!snap.exists()) return [];
  const obj = snap.val() as Record<string, Omit<Centro, "id">>;
  return Object.entries(obj)
    .map(([id, c]) => ({ ...c, id } as Centro))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function getCentro(branchId: string, contractorId: string, centroId: string): Promise<Centro | null> {
  const snap = await get(ref(rtdb, `${basePath(branchId, contractorId)}/${centroId}`));
  if (!snap.exists()) return null;
  const data = snap.val() as Centro;
  return { ...data, id: centroId };
}

export async function createCentro(
  branchId: string,
  contractorId: string,
  payload: Omit<Centro, "id" | "creado_en"> & { creado_por: string }
) {
  const now = Date.now();
  const refNew = push(ref(rtdb, basePath(branchId, contractorId)));
  const id = refNew.key!;
  const data: Centro = {
    id,
    nombre: payload.nombre.trim(),
    codigo: payload.codigo?.trim() || "",
    descripcion: payload.descripcion?.trim() || "",
    activo: payload.activo ?? true,
    creado_en: now,
    creado_por: payload.creado_por,
    actualizado_en: now,
    actualizado_por: payload.creado_por,
  };
  await set(refNew, data);
  return data;
}

export async function updateCentro(
  branchId: string,
  contractorId: string,
  centroId: string,
  patch: Partial<Centro> & { actualizado_por: string }
) {
  const now = Date.now();
  const data = {
    ...(patch.nombre !== undefined ? { nombre: patch.nombre.trim() } : {}),
    ...(patch.codigo !== undefined ? { codigo: patch.codigo?.trim() } : {}),
    ...(patch.descripcion !== undefined ? { descripcion: patch.descripcion?.trim() } : {}),
    ...(patch.activo !== undefined ? { activo: !!patch.activo } : {}),
    actualizado_en: now,
    actualizado_por: patch.actualizado_por,
  };
  await update(ref(rtdb, `${basePath(branchId, contractorId)}/${centroId}`), data);
}

export async function toggleCentroActivo(
  branchId: string,
  contractorId: string,
  centroId: string,
  activo: boolean,
  userId: string
) {
  const now = Date.now();
  await update(ref(rtdb, `${basePath(branchId, contractorId)}/${centroId}`), {
    activo,
    actualizado_en: now,
    actualizado_por: userId,
  });
}

export async function deleteCentro(
  branchId: string,
  contractorId: string,
  centroId: string
) {
  await remove(ref(rtdb, `${basePath(branchId, contractorId)}/${centroId}`));
}
