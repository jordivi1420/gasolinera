// src/services/contractors.service.ts
import { ref, get, set, update, remove } from "firebase/database";
import { rtdb } from "../config/firebase";
import { slugify } from "../utils/slugify";
import { cleanUndefined } from "../utils/clean";

export type Contractor = {
  id: string;
  nombre: string;
  nit?: string;
  contacto?: { nombre?: string; telefono?: string; email?: string };
  activo: boolean;
  creado_en: number;
  creado_por: string;
  actualizado_en?: number;
  actualizado_por?: string;
  admin_uid?: string;
};

// Fila para listados globales o filtrados (branchId obligatorio)
export type ContratistaRow = Contractor & { branchId: string };

export function buildContratistaId(nombre: string) {
  return `${slugify(nombre)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Lee un contratista */
export async function getContratista(branchId: string, contractorId: string) {
  const snap = await get(ref(rtdb, `branches/${branchId}/contractors/${contractorId}`));
  if (!snap.exists()) return null;
  const data = snap.val() as Contractor;
  // Asegura el id desde la ruta por si el nodo no lo guardó
  return { ...data, id: contractorId } as Contractor;
}

/** Lista contratistas por sucursal (solo datos del contratista, sin branchId) */
export async function listContractors(branchId: string): Promise<Contractor[]> {
  const snap = await get(ref(rtdb, `branches/${branchId}/contractors`));
  if (!snap.exists()) return [];
  const obj = snap.val() as Record<string, Contractor>;

  // Usar entries para rescatar la key como id
  const rows: Contractor[] = Object.entries(obj).map(([id, c]) => ({
    ...c,
    id,
  }));

  return rows.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/** Crea contratista */
export async function createContratista(
  branchId: string,
  payload: Omit<Contractor, "id" | "creado_en"> & { id?: string }
) {
  const id = payload.id || buildContratistaId(payload.nombre);
  const now = Date.now();

  const data = cleanUndefined({
    id,
    nombre: payload.nombre.trim(),
    nit: payload.nit || "",
    contacto: payload.contacto || {},
    activo: payload.activo ?? true,
    creado_en: now,
    creado_por: payload.creado_por!,
    actualizado_en: now,
    actualizado_por: payload.creado_por!,
    ...(payload.admin_uid ? { admin_uid: payload.admin_uid } : {}),
  });

  await set(ref(rtdb, `branches/${branchId}/contractors/${id}`), data);
  return data as Contractor;
}

/** Actualiza contratista (patch) */
export async function updateContratista(
  branchId: string,
  contractorId: string,
  patch: Partial<Contractor> & { actualizado_por: string }
) {
  const now = Date.now();
  const data = cleanUndefined({ ...patch, actualizado_en: now });
  await update(ref(rtdb, `branches/${branchId}/contractors/${contractorId}`), data);
}

/** Activar/Desactivar */
export async function toggleContratistaActivo(
  branchId: string,
  contractorId: string,
  activo: boolean,
  userId: string
) {
  const now = Date.now();
  await update(ref(rtdb, `branches/${branchId}/contractors/${contractorId}`), {
    activo,
    actualizado_en: now,
    actualizado_por: userId,
  });
}

/** Eliminar */
export async function deleteContratista(branchId: string, contractorId: string) {
  await remove(ref(rtdb, `branches/${branchId}/contractors/${contractorId}`));
}

/** ✅ Lista por sucursal devolviendo ContratistaRow[] (con branchId) */
export async function listContratistasByBranch(branchId: string): Promise<ContratistaRow[]> {
  const base = await listContractors(branchId); // Contractor[] con id correcto
  return base
    .map((c) => ({ ...c, branchId })) // ← añadimos branchId
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/** ✅ Lista TODOS con branchId */
export async function listAllContratistas(): Promise<ContratistaRow[]> {
  const branchesSnap = await get(ref(rtdb, "branches"));
  if (!branchesSnap.exists()) return [];

  const branches = branchesSnap.val() as Record<
    string,
    { contractors?: Record<string, Contractor> }
  >;

  const rows: ContratistaRow[] = [];
  for (const [branchId, branchVal] of Object.entries(branches)) {
    const contractors = branchVal?.contractors || {};
    for (const [contractorId, c] of Object.entries(contractors)) {
      rows.push({
        ...(c as Contractor),
        id: contractorId, // usar la key como id
        branchId,
      });
    }
  }

  return rows.sort((a, b) => a.nombre.localeCompare(b.nombre));
}
