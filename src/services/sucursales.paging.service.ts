// src/services/sucursales.paging.service.ts
import { ref, get, query, orderByKey, startAt, limitToFirst } from "firebase/database";
import { rtdb } from "../config/firebase";

export type SucursalRow = {
  id: string;
  nombre: string;
  departamento: string;
  municipio: string;
  activa: boolean;
};

const PAGE_SIZE = 10;

export async function fetchSucursalesPage(startKey?: string) {
  // Pedimos pageSize+1 para detectar si hay “siguiente”
  const q = startKey
    ? query(ref(rtdb, "sucursales"), orderByKey(), startAt(startKey), limitToFirst(PAGE_SIZE + 1))
    : query(ref(rtdb, "sucursales"), orderByKey(), limitToFirst(PAGE_SIZE + 1));

  const snap = await get(q);
  if (!snap.exists()) {
    return { rows: [] as SucursalRow[], nextStartKey: undefined, usedStartKey: startKey };
  }

  const obj = snap.val() as Record<string, any>;
  const entries = Object.entries(obj);

  // Si venimos con startKey, la primera puede ser la misma (hay que “saltar”)
  let sliced = entries;
  if (startKey) {
    const i = entries.findIndex(([k]) => k === startKey);
    if (i > -1) sliced = entries.slice(i); // incluye startKey; lo recortamos abajo
  }

  // Nos quedamos con PAGE_SIZE
  const page = sliced.slice(0, PAGE_SIZE);
  const hasMore = sliced.length > PAGE_SIZE;
  const nextStartKey = hasMore ? sliced[PAGE_SIZE][0] : undefined;

  const rows: SucursalRow[] = page.map(([id, s]) => ({
    id,
    nombre: s.nombre,
    departamento: s.departamento,
    municipio: s.municipio,
    activa: !!s.activa,
  }));

  return { rows, nextStartKey, usedStartKey: startKey };
}

export async function countSucursalesKpis() {
  // Para KPI simple: traemos todas (si tienes muchas, luego hacemos un agregado)
  const snap = await get(ref(rtdb, "sucursales"));
  if (!snap.exists()) return { total: 0, activas: 0 };
  const all = Object.values(snap.val() as Record<string, any>) as any[];
  const total = all.length;
  const activas = all.filter(s => !!s.activa).length;
  return { total, activas };
}
