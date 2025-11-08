// src/services/users.service.ts
import { ref, update } from "firebase/database";
import { rtdb } from "../config/firebase";
import { cleanUndefined } from "../utils/clean";

export async function updateUserProfile(uid: string, patch: Record<string, any>) {
  const now = Date.now();
  const data = cleanUndefined({ ...patch, updated_at: now });
  await update(ref(rtdb, `users/${uid}`), data);
}
