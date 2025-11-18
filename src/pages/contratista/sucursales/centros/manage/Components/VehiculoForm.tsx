// FORMULARIO FINAL FUNCIONAL POR CENTRO
import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ComponentCard from "../../../../../../components/common/ComponentCard";
import Label from "../../../../../../components/form/Label";
import Input from "../../../../../../components/form/input/InputField";
import Button from "../../../../../../components/ui/button/Button";

import { useAuth } from "../../../../../../context/AuthContext";

import {
  getVehiculo,
  createVehiculo,
  updateVehiculo,
} from "../../../../../../services/vehiculos.service";

export default function VehiculoForm() {
  const navigate = useNavigate();

  const { branchId, contractorId, centroId, vehiculoId } =
    useParams<{
      branchId: string;
      contractorId: string;
      centroId: string;
      vehiculoId?: string;
    }>();

  const isEdit = !!vehiculoId && vehiculoId !== "nuevo";
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [tipoEquipoId, setTipoEquipoId] = useState("");
  const [capacidadTanqueGal, setCapacidadTanqueGal] = useState("");
  const [consumoL100km, setConsumoL100km] = useState("");
  const [activo, setActivo] = useState(true);

  // ============================
  // CARGAR PARA EDICIÓN
  // ============================
  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      try {
        setLoading(true);

        const data = await getVehiculo(branchId!, vehiculoId!);
        if (!data) {
          setErr("No se encontró el vehículo.");
          return;
        }

        setTipoEquipoId(data.tipo_equipo_id);
        setCapacidadTanqueGal(String(data.capacidad_tanque_gal));
        setConsumoL100km(String(data.consumo_l100km));
        setActivo(data.activo);
      } catch (e: any) {
        setErr(e.message || "Error cargando el vehículo.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, branchId, vehiculoId]);

  // ============================
  // GUARDAR
  // ============================
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!user?.uid) return setErr("No has iniciado sesión.");

    if (!tipoEquipoId.trim()) return setErr("El tipo de equipo es obligatorio.");

    const cap = Number(capacidadTanqueGal);
    const cons = Number(consumoL100km);

    if (cap <= 0) return setErr("Capacidad inválida.");
    if (cons <= 0) return setErr("Consumo inválido.");

    try {
      setLoading(true);

      if (!isEdit) {
        await createVehiculo(branchId!, {
          tipo_equipo_id: tipoEquipoId.trim(),
          capacidad_tanque_gal: cap,
          consumo_l100km: cons,
          activo,
          creado_por: user.uid,
        });
        setOk("Vehículo creado.");
      } else {
        await updateVehiculo(branchId!, vehiculoId!, {
          tipo_equipo_id: tipoEquipoId.trim(),
          capacidad_tanque_gal: cap,
          consumo_l100km: cons,
          activo,
          actualizado_por: user.uid,
        });
        setOk("Cambios guardados.");
      }

      // REDIRECCIÓN CORRECTA
      setTimeout(() => {
        navigate(-1);
      }, 700);

    } catch (e: any) {
      setErr(e.message || "Error guardando.");
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // CANCELAR
  // ============================
  function handleCancel() {
    navigate(-1);
  }

  return (
    <ComponentCard title={isEdit ? "Editar vehículo" : "Nuevo vehículo"}>
      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Tipo de equipo *</Label>
            <Input
              value={tipoEquipoId}
              onChange={(e) => setTipoEquipoId(e.target.value)}
              placeholder="Ej: Camión simple"
            />
          </div>

          <div>
            <Label>Capacidad tanque (gal) *</Label>
            <Input
              type="number"
              step="0.1"
              value={capacidadTanqueGal}
              onChange={(e) => setCapacidadTanqueGal(e.target.value)}
            />
          </div>

          <div>
            <Label>Consumo L/100km *</Label>
            <Input
              type="number"
              step="0.1"
              value={consumoL100km}
              onChange={(e) => setConsumoL100km(e.target.value)}
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

        {err && <p className="text-red-600 text-sm">{err}</p>}
        {ok && <p className="text-green-600 text-sm">{ok}</p>}

        <div className="flex gap-3 mt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Aceptar"}
          </Button>

          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2 rounded-lg border bg-gray-100"
          >
            Cancelar
          </button>
        </div>

      </form>
    </ComponentCard>
  );
}
