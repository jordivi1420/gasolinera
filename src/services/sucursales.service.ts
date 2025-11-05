import { ref, set, update, get } from "firebase/database";
import { rtdb } from "../config/firebase";
import { slugify } from "../utils/slugify";
import { cleanUndefined } from "../utils/clean";

export type Sucursal = {
  id: string;                 // {depSlug}-{munSlug}
  nombre: string;
  departamento: string;
  departamento_slug: string;
  municipio: string;
  municipio_slug: string;
  activa: boolean;
  contacto?: { email?: string; telefono?: string; direccion?: string };
  creado_en: number;
  creado_por: string;
  actualizado_en?: number;
  actualizado_por?: string;
  dane_departamento?: string;
  dane_municipio?: string;
};

export function buildSucursalId(departamento: string, municipio: string) {
  return `${slugify(departamento)}-${slugify(municipio)}`;
}

export async function assertUniqueByMunicipio(id: string) {
  // si usas path por ID, con este patrón queda único por diseño; aquí solo verificamos colisión
  const snap = await get(ref(rtdb, `sucursales/${id}`));
  if (snap.exists()) throw new Error("Ya existe una sucursal para ese municipio y departamento.");
}

export async function createSucursal(payload: Omit<Sucursal, "id" | "creado_en"> & { id?: string }) {
  const id = payload.id || buildSucursalId(payload.departamento, payload.municipio);
  await assertUniqueByMunicipio(id);

  const now = Date.now();
  const data = cleanUndefined({
    id,
    nombre: payload.nombre,
    departamento: payload.departamento,
    departamento_slug: slugify(payload.departamento),
    municipio: payload.municipio,
    municipio_slug: slugify(payload.municipio),
    activa: payload.activa,
    contacto: {
      email: payload.contacto?.email || "",      // o quita la línea si prefieres omitir
      telefono: payload.contacto?.telefono || "",
      direccion: payload.contacto?.direccion || "",
    },
    creado_en: now,
    creado_por: payload.creado_por!,             // asegúrate de pasar user.uid
    actualizado_en: now,
    actualizado_por: payload.creado_por!,
    // Solo incluye si existen:
    ...(payload.dane_departamento ? { dane_departamento: payload.dane_departamento } : {}),
    ...(payload.dane_municipio ? { dane_municipio: payload.dane_municipio } : {}),
  });

  await set(ref(rtdb, `sucursales/${id}`), data);


  return data;
}

export async function updateSucursal(id: string, patch: Partial<Sucursal> & { actualizado_por: string }) {
  const now = Date.now();
  const $ref = ref(rtdb, `sucursales/${id}`);
  await update($ref, { ...patch, actualizado_en: now });
}

export async function toggleSucursalActiva(id: string, activa: boolean, userId: string) {
  const now = Date.now();
  await update(ref(rtdb, `sucursales/${id}`), {
    activa, actualizado_en: now, actualizado_por: userId
  });
}

export async function getSucursal(id: string) {
  const snap = await get(ref(rtdb, `sucursales/${id}`));
  return snap.exists() ? (snap.val() as Sucursal) : null;
}

export async function listSucursales() {
  const snap = await get(ref(rtdb, `sucursales`));
  const obj = snap.exists() ? (snap.val() as Record<string, Sucursal>) : {};
  return Object.values(obj).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

