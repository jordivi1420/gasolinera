// src/pages/admin/contractors/ContractorCreateForm.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ComponentCard from "../../../components/common/ComponentCard";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";

import { useAuth } from "../../../context/AuthContext";
import { listSucursales } from "../../../services/sucursales.service";
import {
  createContratista,
  getContratista,
  updateContratista,
  type Contractor,
} from "../../../services/contratistas.service";

type SucursalOpt = { id: string; nombre: string };

export default function ContractorCreateForm() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { branchId?: string } };
  const params = useParams<{ id?: string }>();
  const contractorId = params.id || "";            // vacío si es crear
  const isEdit = !!contractorId;                   // modo edición
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // form
  const [branchId, setBranchId] = useState("");
  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [emailLogin, setEmailLogin] = useState("");     // contacto.email
  const [activo, setActivo] = useState(true);

  // credenciales opcionales (solo si quieres crearlas al crear)
  const [passwordLogin, setPasswordLogin] = useState("");
  const [password2, setPassword2] = useState("");

  // sucursales para el select
  const [sucursales, setSucursales] = useState<SucursalOpt[]>([]);

  // 1) Cargar sucursales
  useEffect(() => {
    (async () => {
      try {
        const list = await listSucursales();
        const mapped = list
          .map((s) => ({ id: s.id, nombre: s.nombre }) as SucursalOpt)
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        setSucursales(mapped);

        // branch base: del state, o del perfil si no es admin global
        const incomingBranch =
          location.state?.branchId ??
          (!profile?.is_global_admin ? profile?.branchId : "");

        if (incomingBranch) setBranchId(incomingBranch);
      } catch (e) {
        setErr("No se pudieron cargar las sucursales.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sucursalOptions = useMemo(
    () => sucursales.map((s) => ({ value: s.id, label: s.nombre })),
    [sucursales]
  );

  // 2) Si es edición, cargar datos del contratista
  useEffect(() => {
    if (!isEdit) return;

    // Para editar NECESITAMOS el branchId correcto
    //  - intentamos: state.branchId (desde la tabla)
    //  - fallback: branchId ya seteado por perfil
    const effectiveBranchId =
      location.state?.branchId || branchId || profile?.branchId || "";

    if (!effectiveBranchId) {
      setErr("No se pudo determinar la sucursal del contratista.");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await getContratista(effectiveBranchId, contractorId);
        if (!data) {
          setErr("No se encontró el contratista.");
          return;
        }

        // Rellenar form
        setBranchId(effectiveBranchId);
        setNombre(data.nombre || "");
        setNit(data.nit || "");
        setContactoNombre(data.contacto?.nombre || "");
        setTelefono(data.contacto?.telefono || "");
        setEmailLogin(data.contacto?.email || "");
        setActivo(data.activo ?? true);
      } catch (e) {
        setErr("No se pudo cargar el contratista.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, contractorId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!user?.uid) {
      setErr("No has iniciado sesión.");
      return;
    }

    // validaciones mínimas
    if (!branchId) return setErr("Selecciona una sucursal.");
    if (!nombre.trim()) return setErr("Ingresa el nombre del contratista.");

    // Si estás creando y vas a crear credenciales, valida
    const willCreateAuth =
      !isEdit && (emailLogin.trim().length > 0 || passwordLogin.length > 0 || password2.length > 0);

    if (willCreateAuth) {
      if (!emailLogin.trim()) return setErr("Ingresa el correo de acceso del contratista.");
      if (passwordLogin.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
      if (passwordLogin !== password2) return setErr("Las contraseñas no coinciden.");
    }

    setLoading(true);
    try {
      if (isEdit) {
        // ✅ EDITAR
        const patch: Partial<Contractor> = {
          nombre: nombre.trim(),
          nit: nit.trim(),
          activo,
          contacto: {
            nombre: contactoNombre || "",
            telefono: telefono || "",
            email: emailLogin || "",
          },
        };

        await updateContratista(branchId, contractorId, {
          ...patch,
          actualizado_por: user.uid,
        });

        setOk("Contratista actualizado correctamente.");
      } else {
        // ✅ CREAR
        await createContratista(branchId, {
          nombre: nombre.trim(),
          nit: nit.trim(),
          activo,
          contacto: {
            nombre: contactoNombre || "",
            telefono: telefono || "",
            email: emailLogin || "",
          },
          creado_por: user.uid,
        });

        setOk("Contratista creado correctamente.");
      }

      // Regresar al listado
      navigate("/admin/contratistas", { replace: true });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || (isEdit ? "No se pudo actualizar el contratista." : "No se pudo crear el contratista."));
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    navigate("/admin/contratistas");
  }

  // Encontrar etiqueta de sucursal para mostrar
  const sucursalActual = sucursales.find((s) => s.id === branchId)?.nombre || "";

  return (
    <ComponentCard title={isEdit ? "Editar contratista" : "Nuevo contratista"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sucursal */}
        <div>
          <Label>Sucursal *</Label>

          {/* En edición mostramos la actual y permitimos cambiar si quieres */}
          {isEdit && sucursalActual && (
            <p className="text-xs text-gray-500 mb-1">Sucursal actual: <b>{sucursalActual}</b></p>
          )}

          <Select
            options={sucursalOptions}
            placeholder={isEdit && sucursalActual ? `Cambiar sucursal (actual: ${sucursalActual})` : "Selecciona la sucursal"}
            onChange={(val: string) => setBranchId(val)}
            className="dark:bg-dark-900"
            // Si tu Select no es controlable, el placeholder mostrará la actual.
            // Si sí acepta 'value', podrías usar: value={branchId}
          />
        </div>

        {/* Datos del contratista */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Nombre del contratista *</Label>
            <Input value={nombre} onChange={(e: any) => setNombre(e.target.value)} required />
          </div>
          <div>
            <Label>NIT</Label>
            <Input value={nit} onChange={(e: any) => setNit(e.target.value)} />
          </div>
          <div>
            <Label>Contacto (nombre)</Label>
            <Input value={contactoNombre} onChange={(e: any) => setContactoNombre(e.target.value)} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={telefono} onChange={(e: any) => setTelefono(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="activo"
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            <Label htmlFor="activo">Activo</Label>
          </div>
        </div>

        {/* Credenciales (opcional) - solo usa al CREAR */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Correo de acceso (opcional)</Label>
            <Input
              type="email"
              value={emailLogin}
              onChange={(e: any) => setEmailLogin(e.target.value)}
              placeholder="admin@contratista.com"
            />
          </div>
          <div>
            <Label>Contraseña (opcional)</Label>
            <Input
              type="password"
              value={passwordLogin}
              onChange={(e: any) => setPasswordLogin(e.target.value)}
              placeholder="********"
              disabled={isEdit} // normalmente no se cambia aquí al editar
            />
          </div>
          <div>
            <Label>Confirmar contraseña (opcional)</Label>
            <Input
              type="password"
              value={password2}
              onChange={(e: any) => setPassword2(e.target.value)}
              placeholder="********"
              disabled={isEdit}
            />
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-green-600">{ok}</p>}

        <div className="flex gap-3">
          <Button disabled={loading} className="px-5">
            {loading ? (isEdit ? "Guardando..." : "Creando...") : (isEdit ? "Guardar cambios" : "Crear contratista")}
          </Button>
          <button
            type="button"
            className="px-5 bg-gray-100 dark:bg-white/10 rounded-lg border"
            onClick={handleCancel}
          >
            Cancelar
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
