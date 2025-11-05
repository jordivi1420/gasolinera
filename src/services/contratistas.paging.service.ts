// src/services/contractors.paging.service.ts
import { ref, get, query, orderByKey, startAt, limitToFirst } from "firebase/database";
import { rtdb } from "../config/firebase";
import type { Contractor } from "./contratistas.service";

const PAGE_SIZE = 10;

export type ContractorRow = Pick<Contractor, "id" | "nombre" | "nit" | "activo" | "contacto">;

export async function fetchContratistasPage(branchId: string, startKey?: string) {
  const baseRef = ref(rtdb, `branches/${branchId}/contractors`);
  const q = startKey
    ? query(baseRef, orderByKey(), startAt(startKey), limitToFirst(PAGE_SIZE + 1))
    : query(baseRef, orderByKey(), limitToFirst(PAGE_SIZE + 1));

  const snap = await get(q);
  if (!snap.exists()) return { rows: [] as ContractorRow[], nextStartKey: undefined, usedStartKey: startKey };

  const obj = snap.val() as Record<string, any>;
  const entries = Object.entries(obj);

  let sliced = entries;
  if (startKey) {
    const i = entries.findIndex(([k]) => k === startKey);
    if (i > -1) sliced = entries.slice(i);
  }

  const page = sliced.slice(0, PAGE_SIZE);
  const hasMore = sliced.length > PAGE_SIZE;
  const nextStartKey = hasMore ? (sliced[PAGE_SIZE] as [string, any])[0] : undefined;

  const rows: ContractorRow[] = page.map(([id, c]) => ({
    id,
    nombre: c.nombre,
    nit: c.nit || "",
    activo: !!c.activo,
    contacto: c.contacto || {},
  }));

  return { rows, nextStartKey, usedStartKey: startKey };
}

export async function countContratistasKpis(branchId: string) {
  const snap = await get(ref(rtdb, `branches/${branchId}/contractors`));
  if (!snap.exists()) return { total: 0, activos: 0 };
  const all = Object.values(snap.val() as Record<string, any>) as any[];
  const total = all.length;
  const activos = all.filter(c => !!c.activo).length;
  return { total, activos };
}
