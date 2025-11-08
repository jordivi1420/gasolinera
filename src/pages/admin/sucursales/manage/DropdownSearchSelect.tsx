import  { useEffect, useMemo, useRef, useState } from "react";

export type DropdownItem = {
  value: string;
  label: string;
  hint?: string; // ej: email, NIT, etc.
  meta?: any;
};

type Props = {
  items: DropdownItem[];
  onSelect: (value: string, item: DropdownItem) => void;
  triggerClassName?: string;
  triggerText?: string;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
};

export default function DropdownSearchSelect({
  items,
  onSelect,
  triggerClassName,
  triggerText = "Seleccionar",
  placeholder = "Buscar…",
  emptyText = "Sin resultados",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Escape para cerrar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) => {
      const a = it.label?.toLowerCase() ?? "";
      const b = it.hint?.toLowerCase() ?? "";
      return a.includes(term) || b.includes(term);
    });
  }, [items, q]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={
          triggerClassName ??
          "inline-flex items-center h-10 px-3 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
        }
      >
        {triggerText}
        <svg
          className="ml-2 h-4 w-4 opacity-90"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-gray-900 z-50"
          role="menu"
        >
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="mb-2 w-full h-9 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-transparent"
          />

          <div className="max-h-64 overflow-auto space-y-1">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyText}
              </div>
            ) : (
              filtered.map((it) => (
                <button
                  key={it.value}
                  className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5"
                  onClick={() => {
                    onSelect(it.value, it);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  <div className="font-medium">{it.label}</div>
                  {it.hint && <div className="text-xs text-gray-500">{it.hint}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
