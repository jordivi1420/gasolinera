// src/pages/admin/sucursales/SucursalView.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PencilIcon } from "../../../icons"; // ajusta si tu set de íconos está en otra ruta
import { getSucursal, type Sucursal } from "../../../services/sucursales.service";
import Section from "./components/Section";
import KeyValue from "./components/KeyValue";

export default function SucursalView() {
  const { sucursalId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!sucursalId) return;
        const s = await getSucursal(sucursalId);
        if (mounted) setData(s);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [sucursalId]);

  const statusBadge = useMemo(() => {
    const isActive = !!data?.activa;
    const cls = isActive
      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    const dot = isActive ? "bg-green-600" : "bg-red-600";
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {isActive ? "Activa" : "Inactiva"}
      </span>
    );
  }, [data]);

  const formatted = (ms?: number) =>
    typeof ms === "number" && Number.isFinite(ms) ? new Date(ms).toLocaleString() : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/sucursales")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5  text-gray-800 dark:text-white/90"
          >
            <span aria-hidden className="text-base">←</span>
            Atrás
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Sucursal</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vista y gestión de la sucursal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusBadge}
          {data && (
            <Link
              to={`/admin/sucursales/${data.id}/editar`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5  text-gray-800 dark:text-white/90"
              title="Editar sucursal"
            >
              <PencilIcon className="h-4 w-4" />
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <>
          <Section title="Información general" subtitle="Datos básicos de la sucursal">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <KeyValue label="Nombre" value={data.nombre} />
              <KeyValue label="Departamento" value={data.departamento} />
              <KeyValue label="Municipio" value={data.municipio} />
              <KeyValue label="Dirección" value={data.contacto?.direccion || "—"} />
              <KeyValue label="Teléfono" value={data.contacto?.telefono || "—"} />
              <KeyValue label="Correo" value={data.contacto?.email || "—"} />
              <KeyValue label="Creada" value={formatted(data.creado_en)} />
              <KeyValue label="Actualizada" value={formatted(data.actualizado_en)} />
              <KeyValue label="Estado" value={data.activa ? "Activa" : "Inactiva"} />
            </div>
          </Section>

          

          <Section title="Indicadores" subtitle="(Opcional) KPIs de la sucursal">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Stat title="Usuarios" value="—" />
              <Stat title="Contratistas" value="—" />
              <Stat title="Subcentros" value="—" />
              <Stat title="Último movimiento" value={formatted(data.actualizado_en)} />
            </div>
          </Section>
        </>
      )}

      {!loading && !data && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          No se encontró la sucursal solicitada.
        </div>
      )}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
      <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
