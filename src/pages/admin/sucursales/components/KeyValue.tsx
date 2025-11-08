// src/pages/admin/sucursales/view/KeyValue.tsx
export default function KeyValue({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-lg border border-gray-100 p-3 dark:border-white/10">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
        {value ?? "—"}
      </div>
    </div>
  );
}
