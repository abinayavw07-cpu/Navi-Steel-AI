/**
 * firebase.js — NAVI-STEEL AI Firebase SDK initialisation
 * Exports: app, db (Firestore), auth (Firebase Auth), googleProvider
 */
import { initializeApp }            from "firebase/app";
import { getAnalytics }             from "firebase/analytics";
import { getFirestore }             from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyDeUl7yvVFyqntHVt-zlCjuX229_SR_BGM",
  authDomain:        "navi-steel-ai.firebaseapp.com",
  projectId:         "navi-steel-ai",
  storageBucket:     "navi-steel-ai.firebasestorage.app",
  messagingSenderId: "958398325832",
  appId:             "1:958398325832:web:677207cd592bc093b5647d",
  measurementId:     "G-GML7H8EQGD",
};

const app            = initializeApp(firebaseConfig);
const analytics      = getAnalytics(app);

export const db             = getFirestore(app);
export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
