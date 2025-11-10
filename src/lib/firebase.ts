import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAnalytics,
  isSupported,
  type Analytics,
} from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyCVHYgTFA3HnaXA4iIGIQNARVp9cJMO_7A",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "praana-d194a.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "praana-d194a",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "praana-d194a.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "709003786779",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:709003786779:web:785313d33cc3b8318e16be",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-8RS0P669TM",
};

function createFirebaseApp(): FirebaseApp {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
    console.warn(
      "Firebase no se inicializó porque faltan las variables NEXT_PUBLIC_FIREBASE_*."
    );
    throw new Error("Firebase configuration missing");
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

const app = createFirebaseApp();

let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

let analyticsInstance: Analytics | null = null;
let analyticsInitialization: Promise<Analytics | null> | null = null;

export const getFirebaseApp = () => app;

export const getFirebaseFirestore = () => {
  if (!firestore) {
    firestore = getFirestore(app);
  }
  return firestore;
};

export const getFirebaseStorage = () => {
  if (!storage) {
    storage = getStorage(app);
  }
  return storage;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth(app);
  }
  return auth;
};

export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (analyticsInstance) {
    return analyticsInstance;
  }

  if (!analyticsInitialization) {
    analyticsInitialization = isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .then((analytics) => {
        analyticsInstance = analytics;
        return analytics;
      })
      .catch((error) => {
        console.warn("Firebase Analytics no está disponible:", error);
        return null;
      });
  }

  return analyticsInitialization;
};

export type { FirebaseApp, Analytics, Firestore, FirebaseStorage, Auth };

