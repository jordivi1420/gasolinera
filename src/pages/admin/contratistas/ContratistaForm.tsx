import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ComponentCard from "../../../components/common/ComponentCard";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";

import { useAuth } from "../../../context/AuthContext";
import { listSucursales } from "../../../services/sucursales.service";
import {
  createContratista,
  createContractorAuthOnly,
  getContratista,
  updateContratista,
  type Contractor,
  listBranchIdsForContratista,
  getPendingContratista,
  updatePendingContratista,
  createOrUpdatePendingContractor,
  deletePendingContratista,
  removeContratistaFromBranch,   // 👈 NUEVO
} from "../../../services/contratistas.service";

type SucursalOpt = { id: string; nombre: string };

export default function ContractorCreateForm() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { branchId?: string } };
  const params = useParams<{ id?: string }>();
  const contractorId = params.id || "";
  const isEdit = !!contractorId;
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [branchId, setBranchId] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedBranchesEdit, setSelectedBranchesEdit] = useState<string[]>([]);
  const [existingBranchesEdit, setExistingBranchesEdit] = useState<string[]>([]); // 👈 ORIGINAL

  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [emailLogin, setEmailLogin] = useState("");
  const [activo, setActivo] = useState(true);
  const [adminUid, setAdminUid] = useState<string | undefined>(undefined);

  const [passwordLogin, setPasswordLogin] = useState("");
  const [password2, setPassword2] = useState("");

  const [sucursales, setSucursales] = useState<SucursalOpt[]>([]);
  const [isEditPending, setIsEditPending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await listSucursales();
        const mapped = list
          .map((s) => ({ id: s.id, nombre: s.nombre }) as SucursalOpt)
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        setSucursales(mapped);

        if (!isEdit) return;

        const { branchIds } = await listBranchIdsForContratista(contractorId);

        if (branchIds.length === 0) {
          setIsEditPending(true);
          const pend = await getPendingContratista(contractorId);
          if (!pend) {
            setErr("No se encontró el contratista pendiente.");
            return;
          }
          setNombre(pend.nombre || "");
          setNit(pend.nit || "");
          setContactoNombre(pend.contacto?.nombre || "");
          setTelefono(pend.contacto?.telefono || "");
          setEmailLogin(pend.contacto?.email || "");
          setActivo(pend.activo ?? true);
          setAdminUid(pend.admin_uid);
          setSelectedBranchesEdit([]); // podrá elegir asignaciones
          setExistingBranchesEdit([]); // original: ninguna
          return;
        }

        setIsEditPending(false);
        const incomingBranch =
          location.state?.branchId ?? (!profile?.is_global_admin ? profile?.branchId : "");
        const effectiveBranchId =
          incomingBranch && branchIds.includes(incomingBranch)
            ? incomingBranch
            : branchIds[0];

        setBranchId(effectiveBranchId);
        setSelectedBranchesEdit(branchIds);
        setExistingBranchesEdit(branchIds); // 👈 guardamos las originales

        setLoading(true);
        const data = await getContratista(effectiveBranchId, contractorId);
        if (!data) {
          setErr("No se encontró el contratista.");
          return;
        }

        setNombre(data.nombre || "");
        setNit(data.nit || "");
        setContactoNombre(data.contacto?.nombre || "");
        setTelefono(data.contacto?.telefono || "");
        setEmailLogin(data.contacto?.email || "");
        setActivo(data.activo ?? true);
        setAdminUid(data.admin_uid);
      } catch {
        setErr("No se pudieron cargar los datos.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, contractorId]);

  

  function toggleBranch(id: string) {
    setSelectedBranches((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function toggleBranchEdit(id: string) {
    if (!isEditPending && id === branchId) return; // no desmarcar la actual
    setSelectedBranchesEdit((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!user?.uid) return setErr("No has iniciado sesión.");
    if (!nombre.trim()) return setErr("Ingresa el nombre del contratista.");

    /* ───────────── CREACIÓN ───────────── */
    if (!isEdit) {
      const wantsCredentials =
        emailLogin.trim().length > 0 || passwordLogin.length > 0 || password2.length > 0;

      if (wantsCredentials) {
        if (!emailLogin.trim()) return setErr("Ingresa el correo de acceso del contratista.");
        if (passwordLogin.length < 6)
          return setErr("La contraseña debe tener al menos 6 caracteres.");
        if (passwordLogin !== password2) return setErr("Las contraseñas no coinciden.");
      }

      setLoading(true);
      try {
        const baseContact = {
          nombre: contactoNombre || "",
          telefono: telefono || "",
          email: emailLogin || "",
        };

        if (selectedBranches.length === 0) {
          const res = await createContractorAuthOnly({
            email: emailLogin.trim().toLowerCase(),
            password: passwordLogin || "123456",
            displayName: nombre.trim(),
            created_by: user.uid,
            nit: nit.trim(),
            contacto: baseContact,
          });

          await createOrUpdatePendingContractor(res.contractorId, {
            nombre: nombre.trim(),
            nit: nit.trim(),
            activo,
            contacto: baseContact,
            creado_por: user.uid,
            actualizado_por: user.uid,
            admin_uid: res.uid,
          });

          navigate("/admin/contratistas", { replace: true });
          return;
        }

        const [first, ...rest] = selectedBranches;
        const created = await createContratista(first, {
          nombre: nombre.trim(),
          nit: nit.trim(),
          activo,
          contacto: baseContact,
          creado_por: user.uid,
          adminEmail: emailLogin.trim() || undefined,
          adminPassword: wantsCredentials ? passwordLogin : undefined,
        } as any);

        const forcedId = created.id;
        if (rest.length) {
          await Promise.all(
            rest.map((b) =>
              createContratista(b, {
                nombre: nombre.trim(),
                nit: nit.trim(),
                activo,
                contacto: baseContact,
                creado_por: user.uid,
                id: forcedId,
              } as any)
            )
          );
        }

        navigate("/admin/contratistas", { replace: true });
      } catch (e: any) {
        setErr(e?.message || "No se pudo crear el contratista.");
      } finally {
        setLoading(false);
      }
      return;
    }

    /* ───────────── EDICIÓN ───────────── */
    setLoading(true);
    try {
      // PENDIENTE (sin sucursal)
      if (isEditPending) {
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

        if (selectedBranchesEdit.length === 0) {
          await updatePendingContratista(contractorId, {
            ...patch,
            actualizado_por: user.uid,
          });
          navigate("/admin/contratistas", { replace: true });
          return;
        }

        if (!adminUid) {
          setErr("No se encontró el usuario administrador (admin_uid).");
          setLoading(false);
          return;
        }

        const [first, ...rest] = selectedBranchesEdit;
        const basePayload = {
          ...patch,
          creado_por: user.uid,
          admin_uid: adminUid,
          id: contractorId,
        } as any;

        await createContratista(first, basePayload);

        if (rest.length) {
          await Promise.all(
            rest.map((b) =>
              createContratista(b, {
                ...patch,
                creado_por: user.uid,
                admin_uid: adminUid,
                id: contractorId,
              } as any)
            )
          );
        }

        await deletePendingContratista(contractorId);

        navigate("/admin/contratistas", { replace: true });
        return;
      }

      // NORMAL (con sucursal)
      if (!branchId) return setErr("Selecciona la sucursal (obligatorio en edición).");

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

      // ➕ agregar y ➖ quitar en base a la comparación con las originales
      const toAdd = selectedBranchesEdit.filter(
        (b) => b !== branchId && !existingBranchesEdit.includes(b)
      );
      const toRemove = existingBranchesEdit.filter(
        (b) => b !== branchId && !selectedBranchesEdit.includes(b)
      );

      await Promise.all([
        ...toAdd.map((b) =>
          createContratista(b, {
            ...patch,
            creado_por: user.uid,
            id: contractorId,
            adminEmail: undefined,
            adminPassword: undefined,
            admin_uid: adminUid,
          } as any)
        ),
        ...toRemove.map((b) => removeContratistaFromBranch(b, contractorId)),
      ]);

      // Actualizamos el "original" para futuras ediciones sin refrescar
      setExistingBranchesEdit(selectedBranchesEdit);

      navigate("/admin/contratistas", { replace: true });
    } catch (e: any) {
      setErr(e?.message || "No se pudo actualizar el contratista.");
    } finally {
      setLoading(false);
    }
  }

 

  const sucursalActual = sucursales.find((s) => s.id === branchId)?.nombre || "";

  return (
    <ComponentCard title={isEdit ? (isEditPending ? "Editar contratista (sin sucursal)" : "Editar contratista") : "Nuevo contratista"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sucursales */}
        <div>
          <Label>
            {isEdit
              ? (isEditPending
                  ? "Este contratista aún no tiene sucursal. Puedes asignarlo (opcional) seleccionando abajo."
                  : "Sucursales (puedes agregar o quitar)")
              : "Sucursales (opcional, puedes seleccionar varias)"}
          </Label>

          {!isEdit && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {sucursales.map((s) => (
                <label key={s.id} className="flex items-center gap-2 rounded-lg border p-2">
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(s.id)}
                    onChange={() => toggleBranch(s.id)}
                  />
                  <span>{s.nombre}</span>
                </label>
              ))}
              {sucursales.length === 0 && (
                <p className="text-xs text-gray-500">No hay sucursales disponibles.</p>
              )}
            </div>
          )}

          {isEdit && isEditPending && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {sucursales.map((s) => {
                const checked = selectedBranchesEdit.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center gap-2 rounded-lg border p-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBranchEdit(s.id)}
                    />
                    <span>{s.nombre}</span>
                  </label>
                );
              })}
            </div>
          )}

          {isEdit && !isEditPending && (
            <>
              {sucursalActual && (
                <p className="text-xs text-gray-500 mb-2">
                  Sucursal actual: <b>{sucursalActual}</b> (no se puede desmarcar aquí)
                </p>
              )}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {sucursales.map((s) => {
                  const isCurrent = s.id === branchId;
                  const checked = selectedBranchesEdit.includes(s.id) || isCurrent;
                  return (
                    <label key={s.id} className="flex items-center gap-2 rounded-lg border p-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isCurrent}
                        onChange={() => toggleBranchEdit(s.id)}
                      />
                      <span>
                        {s.nombre}
                        {isCurrent && <span className="ml-1 text-xs text-gray-500">(actual)</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {!isEdit && (
            <p className="mt-1 text-xs text-gray-500">
              Si no seleccionas ninguna sucursal, podrás editarlo sin sucursal y asignarlo luego.
            </p>
          )}
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

        {/* Credenciales (solo creación) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Correo de acceso (opcional)</Label>
            <Input
              type="email"
              value={emailLogin}
              onChange={(e: any) => setEmailLogin(e.target.value)}
              placeholder="admin@contratista.com"
              disabled={isEdit}
            />
          </div>
          <div>
            <Label>Contraseña (opcional)</Label>
            <Input
              type="password"
              value={passwordLogin}
              onChange={(e: any) => setPasswordLogin(e.target.value)}
              placeholder="********"
              disabled={isEdit}
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
          <Button type="submit" disabled={loading} className="px-5">
            {loading
              ? isEdit ? "Guardando..." : "Creando..."
              : isEdit ? "Guardar cambios" : "Crear contratista"}
          </Button>
          <button
            type="button"
            className="px-5 bg-gray-100 dark:bg-white/10 rounded-lg border"
            onClick={() => navigate("/admin/contratistas")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
