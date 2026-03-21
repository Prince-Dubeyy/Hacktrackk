import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const getEnv = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

export const firebaseConfig = {
  apiKey: getEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: getEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: getEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: getEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: getEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: getEnv(import.meta.env.VITE_FIREBASE_APP_ID)
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.warn(
    "Firebase environment variables missing:",
    missingKeys,
    "\nPlease add them to .env and restart Vite. Example in .env.example"
  );
}

export const isFirebaseConfigValid = missingKeys.length === 0;

let initializedApp = null;
let initializedAuth = null;
let initializedDb = null;
let initializedGoogleProvider = null;

if (isFirebaseConfigValid) {
  try {
    initializedApp = initializeApp(firebaseConfig);
    initializedAuth = getAuth(initializedApp);
    initializedDb = getFirestore(initializedApp);
    initializedGoogleProvider = new GoogleAuthProvider();
    console.info("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Skipping Firebase initialization because config is incomplete.");
}

export const app = initializedApp;
export const auth = initializedAuth;
export const db = initializedDb;
export const googleProvider = initializedGoogleProvider;

