// src/services/contratistas.service.ts
import { ref, get, set, update, remove } from "firebase/database";
import { rtdb } from "../config/firebase";
import { slugify } from "../utils/slugify";
import { cleanUndefined } from "../utils/clean";
import { getSecondaryAuth, closeSecondaryApp } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as signOutSecondary,
} from "firebase/auth";

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

export type ContratistaRow = Contractor & { branchId: string };
export type ContratistaUnifiedRow = Contractor & { branchIds: string[] };

export type ContractorOrphan = {
  orphanUid: string;
  nombre: string;
  email: string;
  creado_en: number;
  creado_por?: string | null;
  contractorId?: string;
};

export function buildContratistaId(nombre: string) {
  return `${slugify(nombre)}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ───────────────────── Lecturas por sucursal ───────────────────── */
export async function getContratista(branchId: string, contractorId: string) {
  const snap = await get(ref(rtdb, `branches/${branchId}/contractors/${contractorId}`));
  if (!snap.exists()) return null;
  const data = snap.val() as Contractor;
  return { ...data, id: contractorId } as Contractor;
}

export async function listContractors(branchId: string): Promise<Contractor[]> {
  const snap = await get(ref(rtdb, `branches/${branchId}/contractors`));
  if (!snap.exists()) return [];
  const obj = snap.val() as Record<string, Contractor>;
  const rows: Contractor[] = Object.entries(obj).map(([id, c]) => ({ ...c, id }));
  return rows.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/* ───────────────────── Auth secundaria ───────────────────── */
async function createAuthUserSecondary(email: string, password: string, displayName?: string) {
  const secondary = getSecondaryAuth();
  try {
    const cred = await createUserWithEmailAndPassword(secondary, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    const uid = cred.user.uid;
    await signOutSecondary(secondary);
    return { uid };
  } finally {
    try { closeSecondaryApp(); } catch {}
  }
}

/* ─────────────── Pendientes (sin sucursal) en /contractors_pending ─────────────── */
export async function createOrUpdatePendingContractor(
  contractorId: string,
  data: Omit<Contractor, "id" | "creado_en" | "creado_por"> & {
    creado_en?: number;
    creado_por?: string;
  }
) {
  const now = Date.now();
  const payload = cleanUndefined({
    ...data,
    id: contractorId,
    actualizado_en: now,
    creado_en: data.creado_en ?? now,
  });
  await set(ref(rtdb, `contractors_pending/${contractorId}`), payload);
}

export async function getPendingContratista(contractorId: string): Promise<Contractor | null> {
  const snap = await get(ref(rtdb, `contractors_pending/${contractorId}`));
  if (!snap.exists()) return null;
  const data = snap.val() as Contractor;
  return { ...data, id: contractorId };
}

export async function updatePendingContratista(
  contractorId: string,
  patch: Partial<Contractor> & { actualizado_por: string }
) {
  const now = Date.now();
  const data = cleanUndefined({ ...patch, actualizado_en: now });
  await update(ref(rtdb, `contractors_pending/${contractorId}`), data);
}

export async function deletePendingContratista(contractorId: string) {
  await remove(ref(rtdb, `contractors_pending/${contractorId}`));
}

/** SOLO AUTH + pendiente (sin sucursal) */
export async function createContractorAuthOnly(params: {
  email: string;
  password: string;
  displayName: string;
  created_by: string;
  nit?: string;
  contacto?: { nombre?: string; telefono?: string; email?: string };
}) {
  const now = Date.now();
  const { uid } = await createAuthUserSecondary(
    params.email.trim().toLowerCase(),
    params.password,
    params.displayName
  );

  const contractorId = buildContratistaId(params.displayName);

  await update(ref(rtdb), {
    [`users/${uid}`]: {
      email: params.email.trim().toLowerCase(),
      displayName: params.displayName || null,
      is_global_admin: false,
      role: "contractor_admin",
      status: "pending",
      branchId: null,
      contractorId: null,
      created_at: now,
      created_by: params.created_by,
    },
  });

  await createOrUpdatePendingContractor(contractorId, {
    nombre: params.displayName,
    nit: params.nit || "",
    contacto: params.contacto || { email: params.email.trim().toLowerCase() },
    activo: true,
    creado_por: params.created_by,
    actualizado_por: params.created_by,
    admin_uid: uid,
  });

  return { uid, contractorId };
}

/* ───────────────────── Crear/Actualizar en sucursales ───────────────────── */
export async function createContratista(
  branchId: string,
  payload: Omit<Contractor, "id" | "creado_en"> & {
    id?: string;
    adminEmail?: string;
    adminPassword?: string;
  }
) {
  const id = payload.id || buildContratistaId(payload.nombre);
  const now = Date.now();

  let admin_uid = payload.admin_uid;
  if (!admin_uid && payload.adminEmail && payload.adminPassword) {
    const { uid } = await createAuthUserSecondary(
      payload.adminEmail.trim().toLowerCase(),
      payload.adminPassword,
      payload.nombre
    );
    admin_uid = uid;
  }

  const contractorData = cleanUndefined({
    id,
    nombre: payload.nombre.trim(),
    nit: payload.nit || "",
    contacto: payload.contacto || (payload.adminEmail ? { email: payload.adminEmail } : {}),
    activo: payload.activo ?? true,
    creado_en: now,
    creado_por: payload.creado_por!,
    actualizado_en: now,
    actualizado_por: payload.creado_por!,
    ...(admin_uid ? { admin_uid } : {}),
  }) as Contractor;

  await set(ref(rtdb, `branches/${branchId}/contractors/${id}`), contractorData);

  if (admin_uid) {
    const updates: Record<string, any> = {};
    updates[`users/${admin_uid}`] = {
      branchId,
      contractorId: id,
      created_at: now,
      created_by: payload.creado_por!,
      displayName: payload.nombre,
      email: payload.adminEmail ?? contractorData.contacto?.email ?? "",
      is_global_admin: false,
      role: "contractor_admin",
      status: "active",
    };
    updates[`contractorAdmins/${admin_uid}`] = { branchId, contractorId: id, createdAt: now };
    updates[`branches/${branchId}/contractors/${id}/admins/${admin_uid}`] = true;

    await update(ref(rtdb), updates);
  }

  return contractorData;
}

export async function updateContratista(
  branchId: string,
  contractorId: string,
  patch: Partial<Contractor> & { actualizado_por: string }
) {
  const now = Date.now();
  const data = cleanUndefined({ ...patch, actualizado_en: now });
  await update(ref(rtdb, `branches/${branchId}/contractors/${contractorId}`), data);
}

/** Remover simple (solo elimina el nodo de la sucursal) */
export async function removeContratistaFromBranch(branchId: string, contractorId: string) {
  await remove(ref(rtdb, `branches/${branchId}/contractors/${contractorId}`));
}

/** ✅ Remueve de sucursal y limpia referencias. Si queda sin sucursales, lo mueve a contractors_pending. */
export async function removeContratistaFromBranchClean(branchId: string, contractorId: string) {
  // 1) Datos actuales (para admins y payload base)
  const snap = await get(ref(rtdb, `branches/${branchId}/contractors/${contractorId}`));
  if (!snap.exists()) return;
  const contractor = snap.val() as (Contractor & { admins?: Record<string, true> });

  // 2) Borrar el nodo completo de la sucursal (NO incluir hijos del mismo nodo en update)
  const updates: Record<string, any> = {};
  updates[`branches/${branchId}/contractors/${contractorId}`] = null;

  // Admins asociados (desde campo admins o admin_uid único)
  const adminUids = Object.keys(
    contractor.admins || (contractor.admin_uid ? { [contractor.admin_uid]: true } : {})
  );

  // 3) Limpiar referencias externas (no son hijas del nodo borrado → no hay conflicto)
  for (const uid of adminUids) {
    updates[`contractorAdmins/${uid}`] = null;
    updates[`users/${uid}/branchId`] = null;
    updates[`users/${uid}/contractorId`] = null;
    updates[`users/${uid}/status`] = "pending";
  }

  await update(ref(rtdb), updates);

  // 4) ¿Sigue en otras sucursales?
  const { branchIds } = await listBranchIdsForContratista(contractorId);
  if (branchIds.length > 0) return;

  // 5) Mover a pending con payload normalizado
  const now = Date.now();
  const payload = cleanUndefined({
    ...contractor,
    id: contractorId,
    activo: true,
    creado_en: contractor.creado_en ?? now,
    actualizado_en: now,
    actualizado_por: "system",
  }) as Contractor;

  await set(ref(rtdb, `contractors_pending/${contractorId}`), payload);
}

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

export async function deleteContratista(branchId: string, contractorId: string) {
  await remove(ref(rtdb, `branches/${branchId}/contractors/${contractorId}`));
}

/* ───────────────────── Listados y utilidades ───────────────────── */
export async function listContratistasByBranch(branchId: string): Promise<ContratistaRow[]> {
  const base = await listContractors(branchId);
  return base.map((c) => ({ ...c, branchId })).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function listContractorOrphans(): Promise<ContractorOrphan[]> {
  const pendSnap = await get(ref(rtdb, "contractors_pending"));
  const usersSnap = await get(ref(rtdb, "users"));

  const pending = pendSnap.exists()
    ? (pendSnap.val() as Record<string, (Contractor & { admin_uid?: string })>)
    : {};
  const users = usersSnap.exists() ? (usersSnap.val() as Record<string, any>) : {};

  const out: ContractorOrphan[] = [];

  for (const [contractorId, c] of Object.entries(pending)) {
    const uid = (c as any).admin_uid as string | undefined;
    if (!uid) continue;
    const u = users[uid];
    if (
      u &&
      u.role === "contractor_admin" &&
      u.status === "pending" &&
      (u.branchId === null || u.branchId === undefined) &&
      (u.contractorId === null || u.contractorId === undefined)
    ) {
      out.push({
        orphanUid: uid,
        contractorId,
        nombre: c.nombre || u.displayName || u.email || `Contratista ${uid.slice(0, 6)}`,
        email: c.contacto?.email || u.email || "",
        creado_en: Number(c.creado_en ?? u.created_at ?? Date.now()),
        creado_por: c.creado_por ?? u.created_by ?? null,
      });
    }
  }

  return out.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function listAllContratistasUnified(): Promise<
  Array<
    ContratistaUnifiedRow |
    (ContractorOrphan & {
      branchIds: string[];
      id: string;
      activo: boolean;
      orphanUid: string;
      nit?: string;
      contacto?: { nombre?: string; telefono?: string; email?: string };
      actualizado_en?: number;
      actualizado_por?: string;
    })
  >
> {
  const branchesSnap = await get(ref(rtdb, "branches"));
  const map: Record<string, ContratistaUnifiedRow> = {};

  if (branchesSnap.exists()) {
    const branches = branchesSnap.val() as Record<string, { contractors?: Record<string, Contractor> }>;
    for (const [branchId, branchVal] of Object.entries(branches)) {
      const contractors = branchVal?.contractors || {};
      for (const [contractorId, c] of Object.entries(contractors)) {
        const existing = map[contractorId];
        const base: Contractor = { ...(c as Contractor), id: contractorId };

        if (!existing) {
          map[contractorId] = { ...base, branchIds: [branchId] };
        } else {
          const newer =
            (base.actualizado_en ?? base.creado_en ?? 0) >
            (existing.actualizado_en ?? existing.creado_en ?? 0)
              ? base
              : existing;
          map[contractorId] = {
            ...(newer as Contractor),
            id: contractorId,
            branchIds: Array.from(new Set([...(existing.branchIds || []), branchId])),
          };
        }
      }
    }
  }

  const orphans = await listContractorOrphans();
  const pendingSnap = await get(ref(rtdb, "contractors_pending"));
  const pending = pendingSnap.exists()
    ? (pendingSnap.val() as Record<string, Contractor>)
    : {};

  const orphanRows = orphans.map((o) => {
    const p = pending[o.contractorId!];
    return {
      ...o,
      id: o.contractorId!,
      activo: true,
      branchIds: [] as string[],
      nit: p?.nit || "",
      contacto: p?.contacto || { email: o.email },
      actualizado_en: p?.actualizado_en,
      actualizado_por: p?.actualizado_por,
      orphanUid: o.orphanUid,
    };
  });

  const unified = Object.values(map).sort((a, b) => a.nombre.localeCompare(b.nombre));
  return [...unified, ...orphanRows].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function listAllContratistas(): Promise<ContratistaRow[]> {
  const branchesSnap = await get(ref(rtdb, "branches"));
  if (!branchesSnap.exists()) return [];

  const branches = branchesSnap.val() as Record<string, { contractors?: Record<string, Contractor> }>;
  const rows: ContratistaRow[] = [];
  for (const [branchId, branchVal] of Object.entries(branches)) {
    const contractors = branchVal?.contractors || {};
    for (const [contractorId, c] of Object.entries(contractors)) {
      rows.push({ ...(c as Contractor), id: contractorId, branchId });
    }
  }
  return rows.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function listBranchIdsForContratista(contractorId: string): Promise<{
  branchIds: string[];
  sample?: Contractor;
}> {
  const branchesSnap = await get(ref(rtdb, "branches"));
  const out: string[] = [];
  let sample: Contractor | undefined;
  if (branchesSnap.exists()) {
    const branches = branchesSnap.val() as Record<string, { contractors?: Record<string, Contractor> }>;
    for (const [bId, val] of Object.entries(branches)) {
      const cMap = val?.contractors || {};
      const raw = cMap[contractorId];
      if (raw) {
        out.push(bId);
        if (!sample) sample = { ...raw, id: contractorId };
      }
    }
  }
  return { branchIds: out, sample };
}

export async function getContratistaFromAnyBranch(contractorId: string): Promise<{
  branchId?: string;
  data?: Contractor | null;
}> {
  const { branchIds } = await listBranchIdsForContratista(contractorId);
  if (!branchIds.length) return { branchId: undefined, data: null };
  const b = branchIds[0];
  const data = await getContratista(b, contractorId);
  return { branchId: b, data };
}
