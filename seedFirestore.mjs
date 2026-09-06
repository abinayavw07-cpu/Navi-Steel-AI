/**
 * seedFirestore.mjs
 * One-time script: creates user accounts in Firebase Auth
 * + matching role documents in Firestore users/{uid}
 *
 * Run once from project root:
 *   node seedFirestore.mjs
 *
 * Requirements:
 *   - Firebase project must have Email/Password sign-in enabled
 *     (Firebase Console → Authentication → Sign-in method → Email/Password → Enable)
 *   - Google sign-in must also be enabled for the Google button to work
 *     (Firebase Console → Authentication → Sign-in method → Google → Enable)
 */

import { initializeApp }         from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyDeUl7yvVFyqntHVt-zlCjuX229_SR_BGM",
  authDomain:        "navi-steel-ai.firebaseapp.com",
  projectId:         "navi-steel-ai",
  storageBucket:     "navi-steel-ai.firebasestorage.app",
  messagingSenderId: "958398325832",
  appId:             "1:958398325832:web:677207cd592bc093b5647d",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const USERS = [
  { email: "admin@navisteel.ai",      password: "NaviSteel@2025",  displayName: "Admin User",           role: "Chartering Manager"  },
  { email: "manager@navisteel.ai",    password: "Charter@123",     displayName: "Charter Manager",      role: "Chartering Manager"  },
  { email: "captain@navisteel.ai",    password: "PortCaptain#1",   displayName: "Capt. R. Sundaram",    role: "Port Captain"        },
  { email: "analyst@navisteel.ai",    password: "Freight$99",      displayName: "Logistics Analyst",    role: "Logistics Analyst"   },
  { email: "compliance@navisteel.ai", password: "MARPOL2024!",     displayName: "Compliance Officer",   role: "Compliance Officer"  },
  { email: "demo@navisteel.ai",       password: "demo1234",        displayName: "Demo User",            role: "Chartering Manager"  },
];

console.log("🌱  Seeding Firebase Auth + Firestore...\n");

for (const u of USERS) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
    await updateProfile(cred.user, { displayName: u.displayName });

    await setDoc(doc(db, "users", cred.user.uid), {
      uid:         cred.user.uid,
      email:       u.email,
      displayName: u.displayName,
      role:        u.role,
      createdAt:   serverTimestamp(),
    });

    console.log(`  ✅  Created: ${u.email}  →  role: ${u.role}`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log(`  ⚠️  Already exists: ${u.email} (skipped)`);
    } else {
      console.error(`  ❌  Failed: ${u.email} — ${err.message}`);
    }
  }
}

console.log("\n✅  Seed complete. Users are now in Firebase Auth + Firestore.");
process.exit(0);
