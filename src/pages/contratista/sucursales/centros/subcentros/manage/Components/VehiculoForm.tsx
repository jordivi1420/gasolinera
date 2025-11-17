// src/pages/contratista/vehiculos/VehiculoForm.tsx
import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ComponentCard from "../../../../../../../components/common/ComponentCard";
import Label from "../../../../../../../components/form/Label";
import Input from "../../../../../../../components/form/input/InputField";
import Button from "../../../../../../../components/ui/button/Button";

import { useAuth } from "../../../../../../../context/AuthContext";
import {
  getVehiculo,
  createVehiculo,
  updateVehiculo,
  
} from "../../../../../../../services/vehiculos.service";

export default function VehiculoForm() {
  const navigate = useNavigate();

  const {
    branchId,
    contractorId,
    centroId,
    subcentroId,
    vehiculoId,
  } = useParams<{
    branchId: string;
    contractorId: string;
    centroId: string;
    subcentroId: string;
    vehiculoId?: string;
  }>();

  const isEdit = !!vehiculoId && vehiculoId !== "nuevo";

  const { user } = useAuth();

  // FORM STATE
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [tipoEquipoId, setTipoEquipoId] = useState("");
  const [capacidadTanqueGal, setCapacidadTanqueGal] = useState("");
  const [consumoL100km, setConsumoL100km] = useState("");
  const [activo, setActivo] = useState(true);

  // =========================================================
  // CARGAR DATOS EN EDICIÓN
  // =========================================================
  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const data = await getVehiculo(
          branchId!,
          contractorId!,
          centroId!,
          subcentroId!,
          vehiculoId!
        );

        if (!data) {
          setErr("No se encontró el vehículo.");
          return;
        }

        setTipoEquipoId(data.tipo_equipo_id || "");
        setCapacidadTanqueGal(String(data.capacidad_tanque_gal ?? ""));
        setConsumoL100km(String(data.consumo_l100km ?? ""));
        setActivo(data.activo ?? true);

      } catch (e: any) {
        setErr(e?.message || "Error cargando el vehículo.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, branchId, contractorId, centroId, subcentroId, vehiculoId]);

  // =========================================================
  // GUARDAR
  // =========================================================
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!user?.uid) return setErr("No has iniciado sesión.");

    if (!tipoEquipoId.trim()) return setErr("El tipo de equipo es obligatorio.");

    const cap = parseFloat(capacidadTanqueGal);
    const cons = parseFloat(consumoL100km);

    if (isNaN(cap) || cap <= 0) return setErr("Capacidad del tanque inválida.");
    if (isNaN(cons) || cons <= 0) return setErr("Consumo inválido.");

    try {
      setLoading(true);

      if (!isEdit) {
        await createVehiculo(branchId!, contractorId!, centroId!, subcentroId!, {
          tipo_equipo_id: tipoEquipoId.trim(),
          capacidad_tanque_gal: cap,
          consumo_l100km: cons,
          activo,
          creado_por: user.uid,
        });

        setOk("Vehículo creado correctamente.");
      } else {
        await updateVehiculo(
          branchId!,
          contractorId!,
          centroId!,
          subcentroId!,
          vehiculoId!,
          {
            tipo_equipo_id: tipoEquipoId.trim(),
            capacidad_tanque_gal: cap,
            consumo_l100km: cons,
            activo,
            actualizado_por: user.uid,
          }
        );

        setOk("Cambios guardados.");
      }

      // Regresar automáticamente
      setTimeout(() => {
        navigate(
          `/c/${branchId}/${contractorId}/centros/${centroId}/subcentros/${subcentroId}/vehiculos`
        );
      }, 700);

    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar el vehículo.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // CANCELAR
  // =========================================================
  function handleCancel() {
    navigate(
      `/c/${branchId}/${contractorId}/centros/${centroId}/subcentros/${subcentroId}/manage/vehiculos
      `
    );
  }

  // =========================================================
  // UI
  // =========================================================
  return (
    <ComponentCard title={isEdit ? "Editar vehículo" : "Nuevo vehículo"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div>
            <Label>Tipo de equipo *</Label>
            <Input
              value={tipoEquipoId}
              onChange={(e: any) => setTipoEquipoId(e.target.value)}
              placeholder="Ej: Camión simple"
              required
            />
          </div>

          <div>
            <Label>Capacidad del tanque (gal) *</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={capacidadTanqueGal}
              onChange={(e: any) => setCapacidadTanqueGal(e.target.value)}
              placeholder="Ej: 80"
              required
            />
          </div>

          <div>
            <Label>Consumo (L/100km) *</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={consumoL100km}
              onChange={(e: any) => setConsumoL100km(e.target.value)}
              placeholder="Ej: 14"
              required
            />
          </div>

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

        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-green-600">{ok}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="px-5">
            {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Aceptar"}
          </Button>

          <button
            type="button"
            onClick={handleCancel}
            className="px-5 bg-gray-100 dark:bg-white/10 rounded-lg border"
          >
            Cancelar
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
