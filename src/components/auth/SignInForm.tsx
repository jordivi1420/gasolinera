import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";

import { auth, rtdb } from "../../config/firebase";
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { ref, get } from "firebase/database";

type Role =
  | "admin"
  | "branch_admin"
  | "auditor"
  | "contractor_admin"
  | "contractor_user"
  | "viewer";

type Profile = {
  is_global_admin?: boolean;
  role: Role;
  branchId?: string | null;
  contractorId?: string | null;
  status?: "active" | "inactive" | "pending" | string;
  displayName?: string;
  email?: string;
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
    const snap = await get(ref(rtdb, `users/${uid}`));
    return snap.exists() ? (snap.val() as Profile) : null;
  }

  function goAfterLogin(profile: Profile) {
    const cameFromRoot = from === "/" || from === "/signin";

    if (profile.is_global_admin === true) {
      navigate(cameFromRoot ? "/admin/sucursales" : from, { replace: true });
      return;
    }

    switch (profile.role) {
      case "contractor_admin":
      case "contractor_user": {
        const b = profile.branchId ?? "default";
        const c = profile.contractorId ?? "me";
        navigate(cameFromRoot ? `/c/${b}/${c}/dashboard` : from, { replace: true });
        return;
      }
      case "branch_admin":
      case "auditor":
      case "viewer": {
        const b = profile.branchId ?? "default";
        navigate(cameFromRoot ? `/branch/${b}` : from, { replace: true });
        return;
      }
      case "admin": {
        navigate(cameFromRoot ? "/" : from, { replace: true });
        return;
      }
      default: {
        navigate(from, { replace: true });
        return;
      }
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

      if (!profile) {
        setErrMsg("No existe perfil asociado a este usuario.");
        setLoading(false);
        return;
      }

      const isContractor =
        profile.role === "contractor_admin" || profile.role === "contractor_user";

      // Reglas de estado:
      // - Contratista: permitir "active" y "pending"; bloquear "inactive".
      // - Resto de roles: exigir "active".
      if (isContractor) {
        if (profile.status === "inactive") {
          setErrMsg("Tu usuario de contratista está inactivo. Contacta al administrador.");
          setLoading(false);
          return;
        }
        goAfterLogin(profile);
      } else {
        if (profile.status && profile.status !== "active") {
          setErrMsg("Tu usuario está inactivo. Habla con el administrador.");
          setLoading(false);
          return;
        }
        goAfterLogin(profile);
      }
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
                </div>

                {errMsg && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {errMsg}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    className="w-full h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70 disabled:pointer-events-none"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? "Ingresando..." : "Iniciar sesión"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
