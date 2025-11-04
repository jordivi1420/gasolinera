import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // <-- corregido
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";

import { auth,rtdb } from "../../config/firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { ref, set } from "firebase/database";

export default function SignUpForm() {
  const navigate = useNavigate();

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Form state
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [sucursalId, setSucursalId] = useState("maicao"); // inicial por defecto
  const [isAdminGlobal, setIsAdminGlobal] = useState(false); // cambia a true solo para el primer admin

  async function crearPerfil(uid: string) {
    // Perfil mínimo esperado por AuthContext/Rules
    await set(ref(rtdb, `usuarios/${uid}`), {
      nombre,
      apellido,
      email,
      sucursal_id: sucursalId,
      rol: "admin", // o "auditor" / "visor" según tu lógica
      is_admin_global: isAdminGlobal,
      creado_en: Date.now(),
    });
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg(null);

    if (!aceptaTerminos) {
      setErrMsg("Debes aceptar los Términos y la Política de Privacidad.");
      return;
    }

    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await crearPerfil(cred.user.uid);
      navigate("/signin", { replace: true });
    } catch (err: any) {
      const code = String(err?.code || "");
      let msg = "No se pudo registrar. Intenta más tarde.";
      if (code.includes("auth/weak-password")) msg = "La contraseña es muy débil.";
      if (code.includes("auth/email-already-in-use")) msg = "Este correo ya está registrado.";
      if (code.includes("auth/invalid-email")) msg = "Correo inválido.";
      setErrMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setErrMsg(null);

    if (!aceptaTerminos) {
      setErrMsg("Debes aceptar los Términos y la Política de Privacidad.");
      return;
    }

    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      // Si deseas, puedes prellenar nombre/apellido desde cred.user.displayName
      await crearPerfil(cred.user.uid);
      navigate("/signin", { replace: true });
    } catch {
      setErrMsg("No se pudo continuar con Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Volver al dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Crear cuenta
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Registra tus datos para continuar.
            </p>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-60 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
              >
                {/* Google icon */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z" fill="#4285F4" />
                  <path d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z" fill="#34A853" />
                  <path d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z" fill="#FBBC05" />
                  <path d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z" fill="#EB4335" />
                </svg>
                Registrarse con Google
              </button>

              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 opacity-60 dark:bg-white/5 dark:text-white/90"
                title="Próximamente"
              >
                <svg width="21" className="fill-current" height="20" viewBox="0 0 21 20" fill="none">
                  <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                </svg>
                X (deshabilitado)
              </button>
            </div>

            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  O
                </span>
              </div>
            </div>

            {/* Registro por correo */}
            <form onSubmit={handleEmailSignUp}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label>
                      Nombres <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="nombres"
                      placeholder="Tu nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      autoComplete="given-name"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Label>
                      Apellidos <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="apellidos"
                      placeholder="Tu apellido"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div>
                  <Label>
                    Correo <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <Label>
                    Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      role="button"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Sucursal y rol/flag básicos */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label>
                      Sucursal <span className="text-error-500">*</span>
                    </Label>
                    <select
                      className="h-11 w-full rounded-lg border px-3 bg-transparent dark:bg-gray-900 dark:text-white/90"
                      value={sucursalId}
                      onChange={(e) => setSucursalId(e.target.value)}
                      required
                    >
                      <option value="maicao">Maicao</option>
                      <option value="santamarta">Santa Marta</option>
                      {/* añade más municipios cuando los tengas */}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      id="isAdminGlobal"
                      type="checkbox"
                      className="w-5 h-5"
                      checked={isAdminGlobal}
                      onChange={(e) => setIsAdminGlobal(e.target.checked)}
                    />
                    <Label htmlFor="isAdminGlobal">Administrador global</Label>
                  </div>
                </div>

                {/* Términos */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={aceptaTerminos}
                    onChange={setAceptaTerminos}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    Al crear una cuenta aceptas los{" "}
                    <span className="text-gray-800 dark:text-white/90">Términos y Condiciones</span>{" "}
                    y nuestra{" "}
                    <span className="text-gray-800 dark:text-white">Política de Privacidad</span>.
                  </p>
                </div>

                {errMsg && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errMsg}</p>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
                  >
                    {loading ? "Creando..." : "Crear cuenta"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                ¿Ya tienes cuenta?{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
