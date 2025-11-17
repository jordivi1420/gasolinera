// src/services/subcentros.service.ts
import { ref, get, set, update, remove, push } from "firebase/database";
import { rtdb } from "../config/firebase";
import { cleanUndefined } from "../utils/clean";

export type Subcentro = {
  id: string;
  nombre: string;
  codigo?: string;
  activo: boolean;
  creado_en: number;
  creado_por: string;
  actualizado_en?: number;
  actualizado_por?: string;
};

/**
 * Helper para obtener la ruta base de los subcentros
 * NO guardamos sucursal_id ni centro_id dentro del nodo,
 * porque la jerarquía ya nos da ese contexto.
 */
function subcentrosBasePath(
  branchId: string,
  contractorId: string,
  centroId: string
) {
  return `branches/${branchId}/contractors/${contractorId}/centros/${centroId}/subcentros`;
}

/* ───────────────────── Lecturas ───────────────────── */

export async function listSubcentros(
  branchId: string,
  contractorId: string,
  centroId: string
): Promise<Subcentro[]> {
  const snap = await get(
    ref(rtdb, subcentrosBasePath(branchId, contractorId, centroId))
  );
  if (!snap.exists()) return [];

  const obj = snap.val() as Record<string, Subcentro>;
  const rows: Subcentro[] = Object.entries(obj).map(([id, s]) => ({
    ...s,
    id,
  }));

  return rows.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function getSubcentro(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string
): Promise<Subcentro | null> {
  const snap = await get(
    ref(
      rtdb,
      `${subcentrosBasePath(
        branchId,
        contractorId,
        centroId
      )}/${subcentroId}`
    )
  );
  if (!snap.exists()) return null;
  const data = snap.val() as Subcentro;
  return { ...data, id: subcentroId };
}

/* ───────────────────── Crear / Actualizar ───────────────────── */

export async function createSubcentro(
  branchId: string,
  contractorId: string,
  centroId: string,
  payload: Omit<Subcentro, "id" | "creado_en">
) {
  const now = Date.now();

  const baseRef = ref(
    rtdb,
    subcentrosBasePath(branchId, contractorId, centroId)
  );
  const newRef = push(baseRef);
  const id = newRef.key as string;

  const data = cleanUndefined({
    id,
    nombre: payload.nombre.trim(),
    codigo: payload.codigo || "",
    activo: payload.activo ?? true,
    creado_en: now,
    creado_por: payload.creado_por,
    actualizado_en: now,
    actualizado_por: payload.creado_por,
  }) as Subcentro;

  await set(newRef, data);

  return data;
}

export async function updateSubcentro(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string,
  patch: Partial<Subcentro> & { actualizado_por: string }
) {
  const now = Date.now();
  const data = cleanUndefined({
    ...patch,
    actualizado_en: now,
  });

  await update(
    ref(
      rtdb,
      `${subcentrosBasePath(
        branchId,
        contractorId,
        centroId
      )}/${subcentroId}`
    ),
    data
  );
}

/* ───────────────────── Acciones rápidas ───────────────────── */

export async function toggleSubcentroActivo(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string,
  activo: boolean,
  userId: string
) {
  const now = Date.now();
  await update(
    ref(
      rtdb,
      `${subcentrosBasePath(
        branchId,
        contractorId,
        centroId
      )}/${subcentroId}`
    ),
    {
      activo,
      actualizado_en: now,
      actualizado_por: userId,
    }
  );
}

export async function deleteSubcentro(
  branchId: string,
  contractorId: string,
  centroId: string,
  subcentroId: string
) {
  await remove(
    ref(
      rtdb,
      `${subcentrosBasePath(
        branchId,
        contractorId,
        centroId
      )}/${subcentroId}`
    )
  );
}
