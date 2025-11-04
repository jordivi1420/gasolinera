// utils/clean.ts
export function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const out: any = Array.isArray(obj) ? [] : {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined) return;                 // omite undefined
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = cleanUndefined(v);                // limpia anidados
      if (Object.keys(out[k]).length === 0) delete out[k]; // evita objetos vacíos
    } else {
      out[k] = v;
    }
  });
  return out;
}
