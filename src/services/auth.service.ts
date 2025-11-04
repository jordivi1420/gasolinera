// src/services/auth.service.ts
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth,rtdb } from "../config/firebase";
import { ref, get } from "firebase/database";

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await get(ref(rtdb, `usuarios/${cred.user.uid}`));
  const profile = snap.exists() ? snap.val() : null;
  return { user: cred.user, profile };
}

export function logout() {
  return signOut(auth);
}
