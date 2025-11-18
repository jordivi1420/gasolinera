// src/pages/admin/contratistas/centros/CentroFormModal.tsx
import { useEffect, useState } from "react";
import Label from "../../../../../components/form/Label";
import Input from "../../../../../components/form/input/InputField";
import Button from "../../../../../components/ui/button/Button";
import type { Centro } from "../../../../../services/centros.service";

export default function CentroFormModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Centro;
  onSave: (values: { nombre: string; codigo?: string; descripcion?: string; activo: boolean }) => Promise<void> | void;
}) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setNombre(initial?.nombre ?? "");
    setCodigo(initial?.codigo ?? "");
    setDescripcion(initial?.descripcion ?? "");
    setActivo(initial?.activo ?? true);
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!nombre.trim()) {
      setErr("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ nombre: nombre.trim(), codigo: codigo.trim(), descripcion: descripcion.trim(), activo });
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar el centro.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-gray-900">
        <h4 className="mb-4 font-semibold text-gray-800 dark:text-white/90">
          {initial ? "Editar centro" : "Nuevo centro"}
        </h4>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={nombre} onChange={(e: any) => setNombre(e.target.value)} required />
          </div>
          <div>
            <Label>Código</Label>
            <Input value={codigo} onChange={(e: any) => setCodigo(e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <Label>Descripción</Label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none dark:border-white/10 dark:bg-transparent"
              rows={3}
              placeholder="Opcional"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input id="activo" type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            <Label htmlFor="activo">Activo</Label>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-gray-300 px-4 text-sm hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/10"
              disabled={saving}
            >
              Cancelar
            </button>
            {/* 👇 IMPORTANTE: type="submit" */}
            <Button type="submit" disabled={saving} className="h-9 px-4 text-sm">
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
