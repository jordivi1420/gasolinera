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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // catálogos de selects
  const departamentos = useMemo(() => (colombia as Dept[]).map(d => d.departamento), []);
  const ciudades = useMemo(() => {
    const d = (colombia as Dept[]).find(x => x.departamento === departamento);
    return d ? d.ciudades : [];
  }, [departamento]);

  // Cargar para editar
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      setLoading(true);
      const s = await getSucursal(id);
      if (!s) {
        setErr("Sucursal no encontrada.");
        setLoading(false);
        return;
      }
      setDepartamento(s.departamento);
      setMunicipio(s.municipio);
      setNombre(s.nombre);
      setEmail(s.contacto?.email || "");
      setTelefono(s.contacto?.telefono || "");
      setDireccion(s.contacto?.direccion || "");
      setActiva(s.activa);
      setLoading(false);
    })();
  }, [isEdit, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.uid || !profile?.is_admin_global) return; // guard

    if (!departamento || !municipio || !nombre) {
      setErr("Completa departamento, municipio y nombre.");
      return;
    }
    const d = (colombia as Dept[]).find(x => x.departamento === departamento);
    if (!d || !d.ciudades.includes(municipio)) {
      setErr("Municipio inválido para el departamento seleccionado.");
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      if (!isEdit) {
        const newId = buildSucursalId(departamento, municipio);
        await createSucursal({
          id: newId,
          nombre,
          departamento,
          municipio,
          activa,
          contacto: { email, telefono, direccion },
          creado_por: user.uid
        } as any);
        navigate("/admin/sucursales", { replace: true });
      } else {
        // no se cambia el id (clave), solo patch
        await updateSucursal(id!, {
          nombre,
          departamento,
          municipio,
          activa,
          contacto: { email, telefono, direccion },
          actualizado_por: user.uid
        } as any);
        navigate("/admin/sucursales", { replace: true });
      }
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar la sucursal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? "Editar sucursal" : "Nueva sucursal"}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ubicación */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Departamento <span className="text-error-500">*</span></Label>
            <select
              className="h-11 w-full rounded-lg border px-3 bg-transparent dark:bg-gray-900 dark:text-white/90"
              value={departamento}
              onChange={(e)=>{ setDepartamento(e.target.value); setMunicipio(""); if(!isEdit) setNombre(""); }}
              required
            >
              <option value="">Selecciona…</option>
              {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
          <div>
            <Label>Municipio <span className="text-error-500">*</span></Label>
            <select
              className="h-11 w-full rounded-lg border px-3 bg-transparent dark:bg-gray-900 dark:text-white/90"
              value={municipio}
              onChange={(e)=>{ setMunicipio(e.target.value); if(!isEdit) setNombre(e.target.value); }}
              required
              disabled={!departamento}
            >
              <option value="">Selecciona…</option>
              {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Identidad */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Nombre visible <span className="text-error-500">*</span></Label>
            <Input value={nombre} onChange={(e)=>setNombre(e.target.value)} required placeholder="Ej. Maicao" />
          </div>
          <div>
            <Label>Estado</Label>
            <div className="flex items-center gap-3 h-11">
              <input id="activa" type="checkbox" checked={activa} onChange={(e)=>setActiva(e.target.checked)} />
              <label htmlFor="activa">Activa</label>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Email contacto</Label>
            <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="ops@empresa.com" />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={telefono} onChange={(e)=>setTelefono(e.target.value)} placeholder="3001234567" />
          </div>
          <div>
            <Label>Dirección</Label>
            <Input value={direccion} onChange={(e)=>setDireccion(e.target.value)} placeholder="Calle 10 #5-20" />
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex gap-3">
          <Button disabled={loading} className="px-5">{loading ? "Guardando..." : "Guardar"}</Button>
          <Button type="button" className="px-5 bg-gray-100 dark:bg-white/10" onClick={()=>navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
