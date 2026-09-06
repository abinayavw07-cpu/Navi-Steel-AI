/**
 * App.jsx — Master Navigation Controller
 * Auth backend: Firebase Authentication (Email/Password + Google OAuth)
 * Role storage:  Firestore  →  users/{uid}  { role, displayName, createdAt }
 * Light Maritime Ocean Theme (Sky Blue / Ice Blue / Pure White)
 */
import { useState, useEffect } from "react";
import { useIsMobile } from "./utils/useIsMobile";
import {
  Anchor, Globe, LogOut, UserCheck, WifiOff, Wifi,
  Volume2, VolumeX, FileDown, ShieldCheck, Loader2,
  Eye, EyeOff, TrendingUp, BarChart2, Ship, ClipboardCheck, Pencil,
  Menu, X, Settings,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import NaviSteelDashboard from "./components/NaviSteelDashboard";
import { speak, stopSpeech, speakPhrase } from "./utils/speechEngine";

// ─── Currencies ────────────────────────────────────────────────────────────
const CURRENCIES = {
  INR: { label: "INR ₹",  symbol: "₹",   rate: 83.5  },
  USD: { label: "USD $",  symbol: "$",   rate: 1.0   },
  EUR: { label: "EUR €",  symbol: "€",   rate: 0.92  },
  GBP: { label: "GBP £",  symbol: "£",   rate: 0.79  },
  JPY: { label: "JPY ¥",  symbol: "¥",   rate: 150.0 },
  SGD: { label: "SGD S$", symbol: "S$",  rate: 1.35  },
};

const ROLES = [
  {
    id:    "Chartering Manager",
    icon:  TrendingUp,
    emoji: "📈",
    desc:  "Spot & TC freight rate analysis, voyage optimization",
    color: "border-sky-400 bg-sky-50 text-sky-700",
    active:"border-sky-500 bg-sky-500 text-white shadow-sky-300/50",
    badge: "bg-sky-100 text-sky-700",
  },
  {
    id:    "Logistics Analyst",
    icon:  BarChart2,
    emoji: "📊",
    desc:  "Port congestion tracking, bunker intelligence, data ops",
    color: "border-violet-300 bg-violet-50 text-violet-700",
    active:"border-violet-500 bg-violet-500 text-white shadow-violet-300/50",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    id:    "Port Captain",
    icon:  Ship,
    emoji: "⚓",
    desc:  "AIS navigation, tug scheduling, berth allocation",
    color: "border-emerald-300 bg-emerald-50 text-emerald-700",
    active:"border-emerald-500 bg-emerald-500 text-white shadow-emerald-300/50",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    id:    "Compliance Officer",
    icon:  ClipboardCheck,
    emoji: "🛡️",
    desc:  "IMO CII, MARPOL, STCW audit & document verification",
    color: "border-amber-300 bg-amber-50 text-amber-700",
    active:"border-amber-500 bg-amber-500 text-white shadow-amber-300/50",
    badge: "bg-amber-100 text-amber-700",
  },
];

// ─── Firestore: get or create user role doc ───────────────────────────────
// If selectedRole is provided (user explicitly picked one on the login screen),
// always save it — so "Others / custom" roles are always persisted correctly.
async function fetchOrCreateRole(firebaseUser, selectedRole) {
  const ref  = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  // If user chose a role on the login screen, always honour it
  if (selectedRole && selectedRole.trim()) {
    const role = selectedRole.trim();
    await setDoc(ref, {
      uid:         firebaseUser.uid,
      email:       firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email,
      role,
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true });
    return role;
  }

  // No role passed (e.g. auto-restore on page refresh) — use saved role
  if (snap.exists()) {
    return snap.data().role || "Chartering Manager";
  }

  // Absolute fallback — first-ever login with no selection
  const fallback = "Chartering Manager";
  await setDoc(ref, {
    uid:         firebaseUser.uid,
    email:       firebaseUser.email,
    displayName: firebaseUser.displayName || firebaseUser.email,
    role:        fallback,
    createdAt:   serverTimestamp(),
  });
  return fallback;
}

// ─── Login / Register Screen ───────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [mode,        setMode]        = useState("signin"); // "signin" | "signup"
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [role,        setRole]        = useState("Chartering Manager");
  const [customRole,  setCustomRole]  = useState("");
  const [isOthers,    setIsOthers]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const clearFields = () => { setError(""); setSuccess(""); };

  // ── Firebase error code → human message ──────────────────────────────
  const firebaseMsg = (code) => {
    const map = {
      "auth/user-not-found":         "No account found. Please sign up first.",
      "auth/wrong-password":         "Incorrect password. Please try again.",
      "auth/invalid-email":          "Please enter a valid email address.",
      "auth/invalid-credential":     "Invalid email or password.",
      "auth/too-many-requests":      "Too many attempts. Please wait and retry.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/email-already-in-use":   "This email is already registered. Please sign in.",
      "auth/weak-password":          "Password must be at least 6 characters.",
    };
    return map[code] || "Something went wrong. Please try again.";
  };

  // ── Sign In ───────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    clearFields();
    setLoading(true);
    try {
      const cred         = await signInWithEmailAndPassword(auth, email.trim(), password);
      const resolvedRole = await fetchOrCreateRole(cred.user, role);
      onLogin(resolvedRole, cred.user);
    } catch (err) {
      setError(firebaseMsg(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Up (any email — self-registration) ───────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    clearFields();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Save display name
      await updateProfile(cred.user, { displayName: name.trim() || email.split("@")[0] });
      // Save role to Firestore
      await fetchOrCreateRole(cred.user, role);
      setSuccess("Account created! Signing you in…");
      setTimeout(() => onLogin(role, cred.user), 800);
    } catch (err) {
      setError(firebaseMsg(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In / Sign-Up ──────────────────────────────────────────
  const handleGoogle = async () => {
    clearFields();
    setLoading(true);
    try {
      const cred         = await signInWithPopup(auth, googleProvider);
      const resolvedRole = await fetchOrCreateRole(cred.user, role);
      onLogin(resolvedRole, cred.user);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = mode === "signup";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-sky-100/60 to-blue-50 flex items-center justify-center p-6 font-sans">

      {/* Dot-grid overlay */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#0284c7 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative max-w-md w-full bg-white/90 border border-sky-200 rounded-3xl p-8 shadow-xl shadow-sky-100 backdrop-blur-xl space-y-5">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl text-white shadow-lg shadow-sky-400/30">
            <Anchor size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            NAVI-STEEL <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            Advanced Maritime Freight Intelligence
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-600">
            <ShieldCheck size={11} />
            <span>IMO 2024 · MARPOL · CII Certified</span>
          </div>
        </div>

        {/* Sign In / Sign Up tab toggle */}
        <div className="flex gap-1 p-1 bg-sky-50 border border-sky-200 rounded-2xl">
          {["signin", "signup"].map((m) => (
            <button key={m} type="button"
              onClick={() => { setMode(m); clearFields(); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === m
                  ? "bg-white text-sky-700 shadow-sm border border-sky-200"
                  : "text-slate-400 hover:text-sky-600"
              }`}>
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Role picker — 2×2 card grid */}
        <div>
          <label className="block text-[11px] font-bold font-mono uppercase tracking-wide mb-2 text-sky-800">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(({ id, icon: Icon, emoji, desc, color, active }) => {
              const isActive = !isOthers && role === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setRole(id); setIsOthers(false); setCustomRole(""); }}
                  className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all cursor-pointer shadow-sm
                    ${isActive ? `${active} shadow-md` : `${color} hover:shadow-md hover:-translate-y-0.5`}`}
                >
                  {isActive && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">{emoji}</span>
                    <Icon size={13} className={isActive ? "opacity-90" : ""} />
                  </div>
                  <p className={`text-[11px] font-extrabold leading-tight ${isActive ? "text-white" : ""}`}>
                    {id}
                  </p>
                  <p className={`text-[9px] font-mono leading-snug ${isActive ? "text-white/75" : "text-slate-500"}`}>
                    {desc}
                  </p>
                </button>
              );
            })}

            {/* Others — full-width 5th card */}
            <button
              type="button"
              onClick={() => { setIsOthers(true); setRole(customRole || ""); }}
              className={`col-span-2 relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all cursor-pointer shadow-sm
                ${isOthers
                  ? "border-slate-500 bg-slate-700 text-white shadow-slate-300/40 shadow-md"
                  : "border-slate-300 bg-slate-50 text-slate-600 hover:shadow-md hover:-translate-y-0.5"
                }`}
            >
              {isOthers && (
                <span className="absolute top-2 right-3 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[9px] font-black text-white">
                  ✓
                </span>
              )}
              <span className="text-base leading-none">✏️</span>
              <Pencil size={13} className={isOthers ? "text-white/80" : "text-slate-500"} />
              <div>
                <p className={`text-[11px] font-extrabold leading-tight ${isOthers ? "text-white" : "text-slate-700"}`}>
                  Others
                </p>
                <p className={`text-[9px] font-mono ${isOthers ? "text-white/70" : "text-slate-400"}`}>
                  Type your own role below
                </p>
              </div>
            </button>
          </div>

          {/* Custom role text input — shown only when Others is selected */}
          {isOthers && (
            <div className="mt-2">
              <input
                type="text"
                autoFocus
                value={customRole}
                onChange={(e) => { setCustomRole(e.target.value); setRole(e.target.value); }}
                placeholder="e.g. Fleet Manager, Marine Surveyor…"
                className="w-full bg-sky-50/60 border border-sky-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/40 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          )}
        </div>

        {/* Google button */}
        <button type="button" onClick={handleGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 font-bold py-3 rounded-xl text-sm shadow-sm transition-all cursor-pointer hover:border-sky-300 disabled:opacity-60">
          {loading
            ? <Loader2 size={18} className="animate-spin text-sky-500" />
            : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-[11px] font-mono text-slate-400 uppercase">or email</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* ── SIGN IN form ── */}
        {!isSignUp && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <input type="email" required value={email}
              onChange={(e) => { setEmail(e.target.value); clearFields(); }}
              placeholder="your@email.com"
              className={`w-full bg-sky-50/60 border rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 placeholder:text-slate-400 transition-colors ${
                error ? "border-rose-400 focus:ring-rose-400/40 bg-rose-50/30" : "border-sky-200 focus:ring-sky-400/40"
              }`} />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password}
                onChange={(e) => { setPassword(e.target.value); clearFields(); }}
                placeholder="Password"
                className={`w-full bg-sky-50/60 border rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                  error ? "border-rose-400 focus:ring-rose-400/40 bg-rose-50/30" : "border-sky-200 focus:ring-sky-400/40"
                }`} />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs text-rose-700 font-medium">
                <span className="text-rose-500 mt-0.5 shrink-0">✕</span> <span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold py-3 rounded-xl text-sm shadow-md shadow-sky-400/30 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : "Sign In to Dashboard"}
            </button>
            <p className="text-center text-[11px] text-slate-400 font-mono">
              No account?{" "}
              <button type="button" onClick={() => { setMode("signup"); clearFields(); }}
                className="text-sky-600 font-bold hover:underline cursor-pointer">
                Create one free
              </button>
            </p>
          </form>
        )}

        {/* ── SIGN UP form ── */}
        {isSignUp && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <input type="text" required value={name}
              onChange={(e) => { setName(e.target.value); clearFields(); }}
              placeholder="Your full name"
              className="w-full bg-sky-50/60 border border-sky-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/40 placeholder:text-slate-400" />
            <input type="email" required value={email}
              onChange={(e) => { setEmail(e.target.value); clearFields(); }}
              placeholder="your@email.com"
              className={`w-full bg-sky-50/60 border rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 placeholder:text-slate-400 transition-colors ${
                error ? "border-rose-400 focus:ring-rose-400/40 bg-rose-50/30" : "border-sky-200 focus:ring-sky-400/40"
              }`} />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password}
                onChange={(e) => { setPassword(e.target.value); clearFields(); }}
                placeholder="Password (min 6 characters)"
                className={`w-full bg-sky-50/60 border rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                  error ? "border-rose-400 focus:ring-rose-400/40 bg-rose-50/30" : "border-sky-200 focus:ring-sky-400/40"
                }`} />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} required value={confirm}
                onChange={(e) => { setConfirm(e.target.value); clearFields(); }}
                placeholder="Confirm password"
                className={`w-full bg-sky-50/60 border rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                  error ? "border-rose-400 focus:ring-rose-400/40 bg-rose-50/30" : "border-sky-200 focus:ring-sky-400/40"
                }`} />
              <button type="button" tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs text-rose-700 font-medium">
                <span className="text-rose-500 mt-0.5 shrink-0">✕</span> <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 text-xs text-emerald-700 font-medium">
                <span>✓</span> <span>{success}</span>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white font-extrabold py-3 rounded-xl text-sm shadow-md shadow-emerald-400/25 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : "Create Account & Enter"}
            </button>
            <p className="text-center text-[11px] text-slate-400 font-mono">
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("signin"); clearFields(); }}
                className="text-sky-600 font-bold hover:underline cursor-pointer">
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* DB badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span>Secured by Firebase Authentication · Firestore DB</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────
export default function App() {
  // Firebase Auth session (persisted across refreshes automatically)
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading
  const [role,         setRole]         = useState("Chartering Manager");
  const [currency,     setCurrency]     = useState("INR");
  const [language,     setLanguage]     = useState("en");
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);
  const [voiceOn,      setVoiceOn]      = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Auto-close mobile drawer when resizing to desktop
  useEffect(() => { if (!isMobile) setMobileMenuOpen(false); }, [isMobile]);

  // ── Watch Firebase Auth state (survives page refresh) ─────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const savedRole = await fetchOrCreateRole(user, "Chartering Manager");
        setRole(savedRole);
        setFirebaseUser(user);
      } else {
        setFirebaseUser(null);
      }
    });
    return unsub;
  }, []);

  // ── Network listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => { setIsOnline(true);  if (voiceOn) speakPhrase("online",  language); };
    const goOffline = () => { setIsOnline(false); if (voiceOn) speakPhrase("offline", language); };
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [language, voiceOn]);

  const handleLogin = (resolvedRole, user) => {
    setRole(resolvedRole);
    setFirebaseUser(user);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
  };

  const cur = CURRENCIES[currency];

  // ── Auth loading splash ────────────────────────────────────────────────
  if (firebaseUser === undefined) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl text-white shadow-lg">
            <Anchor size={28} />
          </div>
          <Loader2 size={28} className="animate-spin text-sky-500" />
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Connecting to Firebase…</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-sky-50 font-sans">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-sky-200 shadow-sm shadow-sky-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl text-white shadow-md shadow-sky-400/25">
              <Anchor size={17} />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-slate-900 tracking-tight text-sm">NAVI-STEEL</span>
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-black ml-1 text-sm">AI</span>
            </div>
          </div>

          {/* ── Desktop Controls (hidden on mobile) ───────────────────── */}
          <div className="hidden md:flex items-center gap-2 text-xs">

            {/* Logged-in user */}
            <span className="hidden xl:flex items-center gap-1.5 bg-sky-100 border border-sky-300 text-sky-800 px-3 py-1.5 rounded-full font-mono font-bold shrink-0 max-w-[180px] truncate">
              <UserCheck size={12} />
              {firebaseUser.displayName || firebaseUser.email?.split("@")[0] || role}
            </span>

            {/* Role */}
            <span className="hidden lg:flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-full font-mono font-bold shrink-0 max-w-[160px] truncate">
              {role}
            </span>

            {/* Network */}
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold border shrink-0 ${
              isOnline ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
            }`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? "Live" : "Offline"}
            </span>

            {/* Currency */}
            <div className="flex items-center bg-white border border-sky-200 rounded-full px-3 py-1 shrink-0">
              <span className="font-bold text-sky-600 mr-1">{cur.symbol}</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs">
                {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            {/* Language */}
            <div className="flex items-center bg-white border border-sky-200 rounded-full px-3 py-1 shrink-0">
              <Globe size={12} className="text-sky-600 mr-1.5" />
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs">
                <option value="en">English</option>
                <option value="ta">தமிழ்</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>

            {/* Voice */}
            <button type="button" onClick={() => { setVoiceOn((v) => !v); if (voiceOn) stopSpeech(); }}
              className={`p-2 rounded-full border cursor-pointer transition-all ${
                voiceOn ? "bg-sky-100 border-sky-300 text-sky-700" : "bg-slate-100 border-slate-200 text-slate-400"
              }`} title={voiceOn ? "Mute voice" : "Enable voice"}>
              {voiceOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            {/* Export */}
            <button type="button" onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer shrink-0">
              <FileDown size={12} /> Export
            </button>

            {/* Logout */}
            <button type="button" onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer shrink-0">
              <LogOut size={12} /> Logout
            </button>
          </div>

          {/* ── Mobile right side: status pill + hamburger ─────────────── */}
          <div className="flex md:hidden items-center gap-2">
            {/* Compact live/offline pill */}
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isOnline ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
            }`}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isOnline ? "Live" : "Offline"}
            </span>

            {/* Hamburger / close */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 cursor-pointer transition-all"
              aria-label="Settings"
            >
              {mobileMenuOpen ? <X size={18} /> : <Settings size={18} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Settings Drawer ─────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-sky-100 shadow-lg">
            <div className="px-4 py-4 space-y-3">

              {/* User + Role row */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-sky-100">
                <div className="p-2 bg-sky-100 rounded-xl">
                  <UserCheck size={15} className="text-sky-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {firebaseUser.displayName || firebaseUser.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] font-mono text-sky-600 font-bold truncate">{role}</p>
                </div>
                <span className={`ml-auto shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  isOnline ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                }`}>
                  {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {isOnline ? "Live" : "Offline"}
                </span>
              </div>

              {/* Currency row */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wide">Currency</span>
                <div className="flex items-center bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 gap-1.5">
                  <span className="font-bold text-sky-600 text-sm">{cur.symbol}</span>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-sm">
                    {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Language row */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wide">Language</span>
                <div className="flex items-center bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 gap-1.5">
                  <Globe size={14} className="text-sky-600" />
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-sm">
                    <option value="en">English</option>
                    <option value="ta">தமிழ்</option>
                    <option value="hi">हिंदी</option>
                  </select>
                </div>
              </div>

              {/* Voice toggle row */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wide">Voice Alerts</span>
                <button
                  type="button"
                  onClick={() => { setVoiceOn((v) => !v); if (voiceOn) stopSpeech(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm cursor-pointer transition-all ${
                    voiceOn
                      ? "bg-sky-100 border-sky-300 text-sky-700"
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}
                >
                  {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  {voiceOn ? "On" : "Off"}
                </button>
              </div>

              {/* Action buttons row */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { window.print(); setMobileMenuOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all"
                >
                  <FileDown size={14} /> Export
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>

            </div>
          </div>
        )}
      </header>

      <NaviSteelDashboard
        currency={currency}
        curSymbol={cur.symbol}
        exchangeRate={cur.rate}
        language={language}
        isOnline={isOnline}
        onLogout={handleLogout}
        userEmail={firebaseUser.email}
        userName={firebaseUser.displayName || firebaseUser.email}
      />
    </div>
  );
}
