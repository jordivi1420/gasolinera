// src/config/firebase.ts  (ajusta el path según tu proyecto)
import { initializeApp, getApps, deleteApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // 🔴 Usa el MISMO nombre que tienes en tu .env (DATABASE_URL)
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// App principal (producción)
export const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const functions = getFunctions(app, "us-central1");

// ─────────────────────────────────────────────────────────────
// Auth secundario (para crear usuarios sin cerrar tu sesión)
// ─────────────────────────────────────────────────────────────
let _secondaryApp: FirebaseApp | null = null;
let _secondaryAuth: Auth | null = null;

export function getSecondaryAuth(): Auth {
  if (_secondaryAuth) return _secondaryAuth;
  _secondaryApp = initializeApp(firebaseConfig, "secondary");
  _secondaryAuth = getAuth(_secondaryApp);
  return _secondaryAuth;
}

export async function closeSecondaryApp() {
  try {
    if (_secondaryApp) await deleteApp(_secondaryApp);
  } catch {}
  _secondaryApp = null;
  _secondaryAuth = null;
}
