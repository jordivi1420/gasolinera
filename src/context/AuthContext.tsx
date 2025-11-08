// src/context/AuthContext.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, rtdb } from "../config/firebase";

/** Roles soportados */
export type Role =
  | "admin"               // admin global (si además is_global_admin === true)
  | "branch_admin"        // admin de sucursal (si lo usas)
  | "auditor"
  | "contractor_admin"    // admin del contratista (su propio espacio)
  | "contractor_user"     // usuario del contratista
  | "viewer";

/** Perfil guardado en RTDB en users/{uid} */
export type Profile = {
  is_global_admin?: boolean;
  role?: Role;
  branchId?: string | null;
  contractorId?: string | null;
  status?: "active" | "inactive";

  // Básicos
  displayName?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;

  // Social
  social_facebook?: string;
  social_x?: string;
  social_linkedin?: string;
  social_instagram?: string;

  // Dirección / fiscales
  address_country?: string;
  address_city_state?: string;
  address_postal?: string;
  tax_id?: string;

  // Timestamps
  created_at?: number;
  updated_at?: number;
};

type Ctx = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;

  /** Vuelve a leer users/{uid} desde RTDB y actualiza el estado */
  refreshProfile: () => Promise<void>;

  /** Mezcla un patch en el profile local (útil tras un update para reflejar en UI) */
  setProfile: (patch: Partial<Profile>) => void;
};

const AuthCtx = createContext<Ctx>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  setProfile: () => {},
});

async function fetchProfile(uid: string): Promise<Profile | null> {
  const snap = await get(ref(rtdb, `users/${uid}`)); // OJO: path "users/{uid}"
  return snap.exists() ? (snap.val() as Profile) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const p = await fetchProfile(user.uid);
      setProfileState(p);
    } catch {
      // silenciar: si falla, mantenemos el perfil actual
    }
  }, [user?.uid]);

  const setProfile = useCallback((patch: Partial<Profile>) => {
    setProfileState(prev => (prev ? { ...prev, ...patch } : { ...patch }));
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setProfileState(null);
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const p = await fetchProfile(u.uid);
        setProfileState(p);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo<Ctx>(() => ({
    user,
    profile,
    loading,
    refreshProfile,
    setProfile,
  }), [user, profile, loading, refreshProfile, setProfile]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
