import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import colombia from "../../../data/colombia.json";
import { useAuth } from "../../../context/AuthContext";
import { buildSucursalId, createSucursal, getSucursal, updateSucursal } from "../../../services/sucursales.service";

type Dept = { id: number; departamento: string; ciudades: string[] };

export default function SucursalForm() {
  const { id } = useParams(); // si existe -> editar
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [activa, setActiva] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // catálogos de selects
  const departamentos = useMemo(() => (colombia as Dept[]).map((d) => d.departamento), []);
  const ciudades = useMemo(() => {
    const d = (colombia as Dept[]).find((x) => x.departamento === departamento);
    return d ? d.ciudades : [];
  }, [departamento]);

  // Cargar para editar
  useEffect(() => {
    if (!isEdit || !id) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const s = await getSucursal(id);
        if (!mounted) return;
        if (!s) {
          setErr("Sucursal no encontrada.");
          return;
        }
        setDepartamento(s.departamento || "");
        setMunicipio(s.municipio || "");
        setNombre(s.nombre || "");
        setEmail(s.contacto?.email || "");
        setTelefono(s.contacto?.telefono || "");
        setDireccion(s.contacto?.direccion || "");
        setActiva(Boolean(s.activa));
      } catch (e: any) {
        if (mounted) setErr(e?.message || "No se pudo cargar la sucursal.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isEdit, id]);

  function isEmailValid(v: string) {
    if (!v.trim()) return true; // opcional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function findAvailableId(baseId: string): Promise<string> {
    // Si existe el baseId, prueba con sufijos -2, -3, ...
    let candidate = baseId;
    let n = 2;
    // Evita bucles infinitos absurdos (pero deja margen suficiente)
    while (await getSucursal(candidate)) {
      candidate = `${baseId}-${n++}`;
      if (n > 50) break;
    }
    return candidate;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!user?.uid) {
      setErr("Debes iniciar sesión.");
      return;
    }
    if (!profile?. is_global_admin) {
      setErr("No tienes permisos para gestionar sucursales.");
      return;
    }

    const dep = departamento.trim();
    const mun = municipio.trim();
    const nom = nombre.trim();
    const em = email.trim();
    const tel = telefono.trim();
    const dir = direccion.trim();

    if (!dep || !mun || !nom) {
      setErr("Completa departamento, municipio y nombre visible.");
      return;
    }
    const d = (colombia as Dept[]).find((x) => x.departamento === dep);
    if (!d || !d.ciudades.includes(mun)) {
      setErr("Municipio inválido para el departamento seleccionado.");
      return;
    }
    if (!isEmailValid(em)) {
      setErr("Correo de contacto inválido.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      if (!isEdit) {
        const baseId = buildSucursalId(dep, mun);
        const newId = await findAvailableId(baseId);
        await createSucursal({
          id: newId,
          nombre: nom,
          departamento: dep,
          municipio: mun,
          activa,
          contacto: { email: em, telefono: tel, direccion: dir },
          creado_por: user.uid,
        } as any);
      } else {
        // no se cambia el id (clave), solo patch
        await updateSucursal(id!, {
          nombre: nom,
          departamento: dep,
          municipio: mun,
          activa,
          contacto: { email: em, telefono: tel, direccion: dir },
          actualizado_por: user.uid,
        } as any);
      }
      navigate("/admin/sucursales", { replace: true });
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar la sucursal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? "Editar sucursal" : "Nueva sucursal"}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ubicación */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>
              Departamento <span className="text-error-500">*</span>
            </Label>
            <select
              className="h-11 w-full rounded-lg border px-3 bg-transparent dark:bg-gray-900 dark:text-white/90"
              value={departamento}
              onChange={(e) => {
                setDepartamento(e.target.value);
                setMunicipio("");
                if (!isEdit) setNombre("");
              }}
              required
              disabled={loading || submitting}
            >
              <option value="">Selecciona…</option>
              {departamentos.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>
              Municipio <span className="text-error-500">*</span>
            </Label>
            <select
              className="h-11 w-full rounded-lg border px-3 bg-transparent dark:bg-gray-900 dark:text-white/90"
              value={municipio}
              onChange={(e) => {
                setMunicipio(e.target.value);
                if (!isEdit) setNombre(e.target.value);
              }}
              required
              disabled={!departamento || loading || submitting}
            >
              <option value="">Selecciona…</option>
              {ciudades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Identidad */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>
              Nombre visible <span className="text-error-500">*</span>
            </Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ej. Maicao"
              disabled={loading || submitting}
            />
          </div>
          <div>
            <Label>Estado</Label>
            <div className="flex items-center gap-3 h-11">
              <input
                id="activa"
                type="checkbox"
                checked={activa}
                onChange={(e) => setActiva(e.target.checked)}
                disabled={loading || submitting}
              />
              <label htmlFor="activa">Activa</label>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Email contacto</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@empresa.com"
              disabled={loading || submitting}
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3001234567"
              disabled={loading || submitting}
            />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle 10 #5-20"
              disabled={loading || submitting}
            />
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        {/* Aviso de permisos si no es admin global */}
        {!profile?.is_global_admin && (
          <p className="text-sm text-amber-600">
            No tienes permisos para crear/editar sucursales. Contacta a un administrador global.
          </p>
        )}

        <div className="flex gap-3">
          <Button disabled={loading || submitting || !profile?. is_global_admin} className="px-5">
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
          <button
            type="button"
            className="px-5 bg-gray-100 dark:bg-white/10 rounded-lg border"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
