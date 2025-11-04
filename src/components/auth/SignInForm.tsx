import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // <-- corregido
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";

import { auth,rtdb } from "../../config/firebase";
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { ref, get } from "firebase/database";

type Profile = {
  sucursal_id: string;
  rol: "admin" | "auditor" | "visor";
  is_admin_global?: boolean;
};

export default function SignInForm() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [keepLogged, setKeepLogged] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function fetchProfile(uid: string): Promise<Profile | null> {
    const snap = await get(ref(rtdb, `usuarios/${uid}`));
    return snap.exists() ? (snap.val() as Profile) : null;
  }

  function goAfterLogin(profile: Profile | null) {
    // Si es admin global y no venía de otra ruta protegida, lo mandamos al resumen país.
    if (profile?.is_admin_global && (from === "/" || from === "/signin")) {
      navigate("/admin/resumen", { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  }

  async function handleEmailPasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg(null);
    setLoading(true);
    try {
      await setPersistence(auth, keepLogged ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const profile = await fetchProfile(cred.user.uid);
      goAfterLogin(profile);
    } catch (err: any) {
      const code = String(err?.code || "");
      let msg = "No se pudo iniciar sesión. Verifica tus datos.";
      if (code.includes("auth/invalid-email")) msg = "Correo inválido.";
      if (code.includes("auth/user-not-found")) msg = "Usuario no registrado.";
      if (code.includes("auth/wrong-password")) msg = "Contraseña incorrecta.";
      if (code.includes("auth/too-many-requests")) msg = "Demasiados intentos. Intenta más tarde.";
      setErrMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setErrMsg(null);
    setLoading(true);
    try {
      await setPersistence(auth, keepLogged ? browserLocalPersistence : browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const profile = await fetchProfile(cred.user.uid);
      // Nota: si el usuario no tiene perfil en /usuarios/{uid}, puedes crear uno por defecto en un flujo posterior.
      goAfterLogin(profile);
    } catch (err: any) {
      setErrMsg("No se pudo iniciar con Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
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
              Iniciar sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu email y contraseña para continuar.
            </p>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
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
                Iniciar con Google
              </button>

              {/* Placeholder para X/Twitter (requiere habilitar proveedor en Firebase) */}
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
                  O continúa con correo
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailPasswordSignIn}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Correo <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="tucorreo@empresa.com"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    type="email"
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
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={pass}
                      onChange={(e: any) => setPass(e.target.value)}
                      required
                      autoComplete="current-password"
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={keepLogged} onChange={setKeepLogged} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Mantener sesión iniciada
                    </span>
                  </div>
                  <Link to="/reset-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {errMsg && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {errMsg}
                  </div>
                )}

                <div>
                  <Button className="w-full" size="sm" disabled={loading}>
                    {loading ? "Ingresando..." : "Iniciar sesión"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                ¿No tienes cuenta?{" "}
                <Link to="/signup" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Regístrate
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
