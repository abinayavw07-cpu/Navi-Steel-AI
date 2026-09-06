/**
 * MaritimeComplianceSuite — Sky Blue Light Theme
 * White cards with tinted headers (purple / sky / amber / emerald)
 * Cards: Density Scan | Ballast Geofence | Dark Fleet Radar | Crew STCW
 */
import { useState } from "react";
import {
  ShieldAlert, Activity, Lock, Unlock, RefreshCw,
  Volume2, Users, AlertTriangle, CheckCircle2, XCircle,
  Droplets, Scan, Radio, Flame,
} from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from "recharts";
import { calcCII, eeximCheck } from "../utils/geoCalculator";
import { speakPhrase, speak } from "../utils/speechEngine";

// ─── Data ─────────────────────────────────────────────────────────────────────
const MARINE_RESERVES = [
  "Gulf of Mannar Marine National Park",
  "Malvan Marine Sanctuary",
  "Andaman Reef Zone",
  "Lakshadweep Coral Biosphere",
];

const GHOST_VESSELS = [
  { mmsi: "209034201", name: "MV Phantom Cargo", lastSeen: "6h 55m ago", lat: 12.3, lng: 55.8, risk: "CRITICAL" },
  { mmsi: "538007145", name: "MV Shadow Dawn",   lastSeen: "4h 12m ago", lat: 14.2, lng: 74.5, risk: "HIGH"     },
  { mmsi: "477123456", name: "MV Dark Horizon",  lastSeen: "2h 08m ago", lat: 22.9, lng: 65.1, risk: "MEDIUM"   },
];

const INITIAL_CREW = [
  { id: 1, name: "Capt. R. Sundaram",  role: "Master",         restHrs: 11.5, maxHrs: 14 },
  { id: 2, name: "Ch. Off. D. Sharma", role: "Chief Officer",  restHrs: 11.2, maxHrs: 14 },
  { id: 3, name: "2nd Off. K. Rajan",  role: "2nd Officer",    restHrs: 11.0, maxHrs: 14 },
  { id: 4, name: "Ch. Eng. P. Nair",   role: "Chief Engineer", restHrs: 7.8,  maxHrs: 14 },
  { id: 5, name: "2nd Eng. S. Kumar",  role: "2nd Engineer",   restHrs: 6.5,  maxHrs: 14 },
];

// ─── Risk styles — light theme ────────────────────────────────────────────────
const RISK = {
  CRITICAL: {
    row:   "bg-red-50    border-red-300   hover:border-red-400",
    badge: "bg-red-100   text-red-800     border border-red-300",
    dot:   "bg-red-500",
    pulse: true,
  },
  HIGH: {
    row:   "bg-amber-50  border-amber-300 hover:border-amber-400",
    badge: "bg-amber-100 text-amber-800   border border-amber-300",
    dot:   "bg-amber-500",
    pulse: false,
  },
  MEDIUM: {
    row:   "bg-sky-50    border-sky-200   hover:border-sky-300",
    badge: "bg-purple-100 text-purple-800 border border-purple-300",
    dot:   "bg-yellow-500",
    pulse: false,
  },
};

// ─── Card header component ────────────────────────────────────────────────────
function CardHeader({ icon: Icon, iconBg, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl border ${iconBg}`}>
          <Icon size={17} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Radar ring (light purple) ────────────────────────────────────────────────
function RadarRing({ active }) {
  return (
    <div className="relative w-24 h-24 shrink-0">
      <div className={`absolute inset-0 rounded-full border-2 transition-all ${active ? "border-purple-400 animate-ping" : "border-purple-200"}`} />
      <div className={`absolute inset-2 rounded-full border transition-all ${active ? "border-purple-300 animate-ping" : "border-purple-100"}`} style={{ animationDelay: "0.3s" }} />
      <div className={`absolute inset-4 rounded-full border transition-all ${active ? "border-purple-200 animate-ping" : "border-purple-50"}`} style={{ animationDelay: "0.6s" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <Scan size={22} className={active ? "text-purple-600 animate-pulse" : "text-purple-300"} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MaritimeComplianceSuite({
  tonnage = 75000, distanceNm = 850, fuelConsumedMt = 180, language = "en",
}) {
  const ciiData  = calcCII(fuelConsumedMt, distanceNm, tonnage);
  const eexiData = eeximCheck(tonnage * 0.042, tonnage);

  // Density scan
  const [scanning,   setScanning]   = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanZones,  setScanZones]  = useState(Array(6).fill("idle"));

  const runScan = () => {
    setScanning(true);
    setScanResult(null);
    setScanZones(Array(6).fill("scanning"));
    setTimeout(() => {
      const anomaly  = Math.random() > 0.6;
      const conf     = Math.floor(72 + Math.random() * 26);
      const newZones = Array(6).fill("clear");
      if (anomaly) newZones[Math.floor(Math.random() * 6)] = "anomaly";
      setScanZones(newZones);
      setScanResult({ anomaly, confidence: conf });
      setScanning(false);
      if (anomaly) speak("Warning. Hull density anomaly detected.", language);
    }, 2000);
  };

  // Ballast valve
  const [ballastLocked, setBallastLocked] = useState(false);
  const [nearReserve,   setNearReserve]   = useState(MARINE_RESERVES[1]);

  // Dark fleet
  const [crew, setCrew] = useState(INITIAL_CREW);
  const rotateCrew = (id) => setCrew((c) => c.map((m) => m.id === id ? { ...m, restHrs: Math.min(m.maxHrs, m.restHrs + 2) } : m));

  const ciiChart = [{ name: "CII", value: Math.min(ciiData.cii, 10) }];

  return (
    <div className="space-y-6">

      {/* ── CII / EEXI Banner ── */}
      <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        {/* Radial CII gauge */}
        <div className="w-24 h-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="62%" outerRadius="90%"
              data={ciiChart} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#e0f2fe" }}>
                <Cell fill={ciiData.color} />
              </RadialBar>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">IMO CII 2026 Rating</span>
            <button onClick={() => speakPhrase("ciiWarning", language, ciiData.rating)}
              className="p-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg cursor-pointer transition-colors">
              <Volume2 size={11} className="text-sky-600" />
            </button>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-black" style={{ color: ciiData.color }}>{ciiData.rating}</span>
            <span className="text-sm font-semibold text-slate-700">{ciiData.label}</span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {["A","B","C","D","E"].map((r) => (
              <span key={r}
                className={`w-7 h-7 flex items-center justify-center text-xs font-black rounded-lg transition-all ${
                  r === ciiData.rating ? "text-white" : "text-slate-400 bg-sky-50 border border-sky-100"
                }`}
                style={{ background: r === ciiData.rating ? ciiData.color : undefined }}>
                {r}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-3 shrink-0 flex-wrap sm:flex-col sm:gap-2">
          {[
            { label: "Fuel Burned", val: `${fuelConsumedMt} MT` },
            { label: "Distance",    val: `${distanceNm} NM`     },
            { label: "EEXI",        val: eexiData.compliant ? "✓ Compliant" : "✗ Deficient",
              cls: eexiData.compliant ? "text-emerald-700" : "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 text-center min-w-[90px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">{s.label}</div>
              <div className={`text-xs font-bold font-mono mt-0.5 ${s.cls ?? "text-slate-700"}`}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2×2 Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Card A: Anti-Smuggling Density Scan ── */}
        <div className="bg-white border border-sky-200 rounded-2xl p-6 shadow-sm flex flex-col overflow-hidden">
          {/* Purple tinted header strip */}
          <div className="-mx-6 -mt-6 mb-5 px-6 pt-4 pb-3 rounded-t-2xl bg-purple-50 border-b border-purple-100">
            <CardHeader
              icon={Scan}
              iconBg="bg-purple-100 border-purple-200 text-purple-700"
              title="Anti-Smuggling Density Scan"
              subtitle="Hull mass anomaly vs. declared cargo density"
            />
          </div>

          <div className="flex items-center gap-5 mb-6">
            <RadarRing active={scanning} />
            <div className="flex-1 text-xs font-mono text-slate-500 space-y-1">
              <div>Protocol: <span className="text-purple-700 font-bold">IMO FAL.5/Circ.39</span></div>
              <div>Method: <span className="text-slate-700">Gravitational Density Differential</span></div>
              <div>Zones: <span className="text-slate-700">6 hull segments</span></div>
            </div>
          </div>

          {/* Zone grid */}
          <div className="grid grid-cols-6 gap-1.5 mb-5">
            {scanZones.map((z, i) => (
              <div key={i} className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border transition-all duration-500
                ${z === "scanning" ? "bg-purple-100 border-purple-300 text-purple-700 animate-pulse"
                : z === "anomaly"  ? "bg-red-100    border-red-300    text-red-700"
                : z === "clear"    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                :                   "bg-sky-50      border-sky-200    text-slate-400"}`}>
                {z === "anomaly" ? "⚠" : z === "clear" ? "✓" : `Z${i + 1}`}
              </div>
            ))}
          </div>

          <button onClick={runScan} disabled={scanning}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer
              bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500
              disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400
              text-white shadow-md shadow-purple-200 hover:scale-[1.01] active:scale-[0.99]">
            {scanning
              ? <><RefreshCw size={14} className="animate-spin" /> Scanning Hull…</>
              : <><Activity size={14} /> Run Cargo Density Scan</>}
          </button>

          {scanResult && (
            <div className={`mt-4 p-3.5 rounded-xl border font-mono text-xs leading-relaxed ${
              scanResult.anomaly
                ? "bg-red-50 border-red-300 text-red-700"
                : "bg-emerald-50 border-emerald-300 text-emerald-700"
            }`}>
              <div className="font-bold mb-1">{scanResult.anomaly ? "⚠  ANOMALY DETECTED" : "✓  SCAN CLEAR"}</div>
              <div className="text-[11px] opacity-80">
                Confidence: {scanResult.confidence}% —{" "}
                {scanResult.anomaly
                  ? "Mass inconsistency detected. Initiate secondary physical inspection."
                  : "No density irregularities found. Manifest matches sensor readings."}
              </div>
            </div>
          )}
        </div>

        {/* ── Card B: Ballast Water Geofence Lock ── */}
        <div className="bg-white border border-sky-200 rounded-2xl p-6 shadow-sm flex flex-col overflow-hidden">
          <div className="-mx-6 -mt-6 mb-5 px-6 pt-4 pb-3 rounded-t-2xl bg-sky-50 border-b border-sky-100">
            <CardHeader
              icon={Droplets}
              iconBg="bg-sky-100 border-sky-200 text-sky-700"
              title="Ballast Water Geofence Lock"
              subtitle="IMO BWM Convention D-2 · 12 NM exclusion zone"
            />
          </div>

          {/* Reserve selector */}
          <div className="mb-4">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-2">
              Nearest Marine Reserve
            </label>
            <select value={nearReserve} onChange={(e) => setNearReserve(e.target.value)}
              className="w-full bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/40 cursor-pointer transition-colors">
              {MARINE_RESERVES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Status display */}
          <div className={`relative overflow-hidden flex items-center justify-between px-5 py-4 rounded-2xl border mb-4 transition-all duration-500 ${
            ballastLocked
              ? "bg-red-50  border-red-300"
              : "bg-emerald-50 border-emerald-200"
          }`}>
            {ballastLocked && (
              <div className="absolute inset-0 rounded-2xl border-2 border-red-300 animate-ping pointer-events-none" />
            )}
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${ballastLocked ? "bg-red-100" : "bg-emerald-100"}`}>
                {ballastLocked
                  ? <Lock   size={20} className="text-red-600" />
                  : <Unlock size={20} className="text-emerald-700" />}
              </div>
              <div>
                <div className={`text-sm font-bold ${ballastLocked ? "text-red-700" : "text-emerald-700"}`}>
                  {ballastLocked ? "Discharge PROHIBITED" : "Discharge PERMITTED"}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5 max-w-[180px] truncate">{nearReserve}</div>
              </div>
            </div>
            <button onClick={() => setBallastLocked((l) => !l)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                ballastLocked
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-400 shadow-sm shadow-red-200"
                  : "bg-white hover:bg-sky-50 text-slate-700 border-sky-200 hover:border-sky-400"
              }`}>
              {ballastLocked ? "Unlock Valve" : "Lock Valve"}
            </button>
          </div>

          {/* Info specs */}
          <div className="mt-auto space-y-2">
            {[
              { label: "Exclusion Radius", val: "12 NM from reserve boundary" },
              { label: "Convention",       val: "IMO BWM 2004 / D-2 Standard" },
              { label: "Penalty",          val: "USD 25,000+ fine on breach"   },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-[11px] font-mono border-b border-sky-50 pb-1.5">
                <span className="text-slate-400">{s.label}</span>
                <span className="text-slate-700 font-semibold">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Card C: Dark Fleet / AIS Spoofing Radar ── */}
        <div className="bg-white border border-sky-200 rounded-2xl p-6 shadow-sm overflow-hidden">
          <div className="-mx-6 -mt-6 mb-5 px-6 pt-4 pb-3 rounded-t-2xl bg-amber-50 border-b border-amber-100">
            <CardHeader
              icon={Radio}
              iconBg="bg-amber-100 border-amber-200 text-amber-700"
              title="Dark Fleet / AIS Spoofing Radar"
              subtitle="Satellite AIS cross-reference · inertial fallback"
            />
          </div>

          <div className="space-y-3">
            {GHOST_VESSELS.map((v) => {
              const r = RISK[v.risk];
              return (
                <div key={v.mmsi}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-default group ${r.row}`}>
                  {/* Threat dot */}
                  <div className="shrink-0 relative">
                    <div className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
                    {r.pulse && <div className={`absolute inset-0 rounded-full ${r.dot} animate-ping opacity-50`} />}
                  </div>
                  {/* Vessel info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{v.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      MMSI: <span className="text-slate-600">{v.mmsi}</span>
                      {" · "}Last AIS: <span className="text-slate-600">{v.lastSeen}</span>
                    </div>
                  </div>
                  {/* Risk badge + voice */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black font-mono ${r.badge}`}>
                      {v.risk}
                    </span>
                    <button
                      onClick={() => speakPhrase("aisSpoof", language, v.name)}
                      className="p-1.5 bg-white hover:bg-sky-50 border border-sky-200 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                      <Volume2 size={12} className="text-sky-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-mono text-amber-700">
            <AlertTriangle size={12} className="text-amber-500 shrink-0" />
            {GHOST_VESSELS.filter((v) => v.risk === "CRITICAL").length} CRITICAL · {GHOST_VESSELS.filter((v) => v.risk === "HIGH").length} HIGH · {GHOST_VESSELS.filter((v) => v.risk === "MEDIUM").length} MEDIUM threats active
          </div>
        </div>

        {/* ── Card D: Crew STCW Fatigue Monitor ── */}
        <div className="bg-white border border-sky-200 rounded-2xl p-6 shadow-sm overflow-hidden">
          <div className="-mx-6 -mt-6 mb-5 px-6 pt-4 pb-3 rounded-t-2xl bg-emerald-50 border-b border-emerald-100">
            <CardHeader
              icon={Users}
              iconBg="bg-emerald-100 border-emerald-200 text-emerald-700"
              title="Crew STCW Fatigue Monitor"
              subtitle="Manila 2010 Amendments · Min 10h rest / 24h"
            />
          </div>

          <div className="space-y-3">
            {crew.map((m) => {
              const pct    = Math.min((m.restHrs / m.maxHrs) * 100, 100);
              const ok     = m.restHrs >= 10;
              const barCls = ok ? (pct > 70 ? "bg-sky-500" : "bg-amber-500") : "bg-red-500";

              return (
                <div key={m.id} className="bg-sky-50/60 border border-sky-100 hover:border-sky-200 rounded-xl px-4 py-3 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900">{m.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono ml-2">{m.role}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {ok
                        ? <CheckCircle2 size={14} className="text-emerald-600" />
                        : <XCircle      size={14} className="text-red-600"     />}
                      <span className={`text-xs font-black font-mono ${ok ? "text-emerald-700" : "text-red-600"}`}>
                        {m.restHrs}h
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">/ {m.maxHrs}h</span>
                      {!ok && (
                        <button onClick={() => rotateCrew(m.id)}
                          className="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors">
                          Rotate
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${barCls}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  {!ok && (
                    <div className="mt-1.5 text-[10px] font-mono text-red-600 opacity-80">
                      ⚠ STCW violation — mandatory rest not met
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[11px] font-mono">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl py-2">
              <div className="text-slate-400">Compliant</div>
              <div className="text-emerald-700 font-bold text-base mt-0.5">
                {crew.filter((m) => m.restHrs >= 10).length} / {crew.length}
              </div>
            </div>
            <div className={`border rounded-xl py-2 ${crew.filter((m) => m.restHrs < 10).length > 0 ? "bg-red-50 border-red-200" : "bg-sky-50 border-sky-100"}`}>
              <div className="text-slate-400">Violations</div>
              <div className={`font-bold text-base mt-0.5 ${crew.filter((m) => m.restHrs < 10).length > 0 ? "text-red-600" : "text-emerald-700"}`}>
                {crew.filter((m) => m.restHrs < 10).length}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
