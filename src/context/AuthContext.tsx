// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, rtdb } from "../config/firebase";

type Role =
  | "admin"               // admin global (si además is_global_admin === true)
  | "branch_admin"        // admin de sucursal (si lo usas)
  | "auditor"
  | "contractor_admin"    // admin del contratista (su propio espacio)
  | "contractor_user"     // usuario del contratista
  | "viewer";

type Profile = {
  is_global_admin?: boolean;
  role: Role;
  branchId?: string | null;
  contractorId?: string | null;
  status?: "active" | "inactive";
  displayName?: string;
  email?: string;
};

type Ctx = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

const AuthCtx = createContext<Ctx>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Ctx>({ user: null, profile: null, loading: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setState({ user: null, profile: null, loading: false });
        return;
      }
      try {
        // Lee el perfil desde users/{uid} (no usuarios/{uid})
        const snap = await get(ref(rtdb, `users/${u.uid}`));
        const profile = snap.exists() ? (snap.val() as Profile) : null;
        setState({ user: u, profile, loading: false });
      } catch {
        setState({ user: u, profile: null, loading: false });
      }
    });
    return () => unsub();
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
