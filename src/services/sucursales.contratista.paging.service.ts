// src/services/sucursales.contractor.service.ts
import { ref, get } from "firebase/database";
import { rtdb } from "../config/firebase";

import type { SucursalRow } from "./sucursales.paging.service";
import { listBranchIdsForContratista } from "./contratistas.service";
import { listSucursales } from "./sucursales.service";

/**
 * Busca un contractorId a partir del email de contacto del contratista.
 * Recorre todas las branches y sus contractors.
 */
async function findContractorIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  const emailNorm = email.trim().toLowerCase();
  const snap = await get(ref(rtdb, "branches"));

  if (!snap.exists()) {
    console.warn("[contractor] findContractorIdByEmail - no hay branches");
    return null;
  }

  const branches = snap.val() as Record<
    string,
    { contractors?: Record<string, any> }
  >;

  for (const [, val] of Object.entries(branches)) {
    const contractors = val.contractors || {};
    for (const [contractorId, raw] of Object.entries(contractors)) {
      const c: any = raw;
      const contactEmail = (c.contacto?.email || "").toLowerCase();
      if (contactEmail && contactEmail === emailNorm) {

        return contractorId;
      }
    }
  }

  console.warn("[contractor] findContractorIdByEmail - sin match para", emailNorm);
  return null;
}

/**
 * Resuelve contractorId usando:
 *  - contractorId del perfil (si existe),
 *  - o el email del perfil buscando en contractors.contacto.email.
 */
async function resolveContractorId(params: {
  contractorId?: string | null;
  email?: string | null;
}): Promise<string | null> {
  const direct = params.contractorId?.trim();
  if (direct) {
    
    return direct;
  }

  if (params.email) {
    const byEmail = await findContractorIdByEmail(params.email);
    if (byEmail) return byEmail;
  }

  console.warn("[contractor] resolveContractorId - no se pudo resolver contractorId");
  return null;
}

/**
 * Devuelve las sucursales asignadas al contratista actual
 * ya mapeadas a SucursalRow.
 *
 * params:
 *  - contractorId: id del contratista (si viene en el perfil)
 *  - email: email del usuario (para buscar contractor por contacto.email)
 */
export async function listSucursalesForCurrentContractor(params: {
  contractorId?: string | null;
  email?: string | null;
}): Promise<SucursalRow[]> {
  

  const resolvedId = await resolveContractorId(params);
  

  if (!resolvedId) {
    return [];
  }

  // 1) IDs de sucursales donde está ese contractorId
  const { branchIds } = await listBranchIdsForContratista(resolvedId);


  if (!branchIds || branchIds.length === 0) {
    console.warn(
      "[contractor] listSucursalesForCurrentContractor - contractor SIN sucursales",
      resolvedId,
    );
    return [];
  }

  // 2) Traer todas las sucursales con tu servicio oficial
  const all = (await listSucursales()) as any[];
 

  const setIds = new Set(branchIds);

  // 3) Filtrar y mapear a SucursalRow
  const rows: SucursalRow[] = all
    .filter((s) => s && setIds.has(s.id))
    .map((s) => ({
      id: String(s.id),
      nombre: String(s.nombre ?? "Sucursal"),
      departamento: String(s.departamento ?? "-"),
      municipio: String(s.municipio ?? "-"),
      activa: Boolean(s.activa ?? true),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  

  return rows;
}
