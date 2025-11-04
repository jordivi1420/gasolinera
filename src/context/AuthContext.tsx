// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, rtdb } from "../config/firebase";

type Profile = {
  sucursal_id: string;
  rol: "admin" | "auditor" | "visor";
  is_admin_global?: boolean;
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
        const snap = await get(ref(rtdb, `usuarios/${u.uid}`));
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