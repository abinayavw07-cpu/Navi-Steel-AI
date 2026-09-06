/**
 * EastCoastModePanel — Primary East Coast India Corridor Suite
 * Sky Blue Light Theme · White cards · sky-200 borders
 *
 * Seven modules:
 *  1. Small Fishing Fleet Collision Radar (Chennai / Vizag / Tuticorin)
 *  2. Bay of Bengal Cyclone & Tsunami Evasion Status
 *  3. EC Port Congestion Mini-Tracker (5 ports, live-updating)
 *  4. River Debris Intake + Anti-Smuggling Hull Density Scanner
 *  5. Cyclone Disaster Relief Corridor Router
 *  6. Eco-Sensitive Geofencing (Gulf of Mannar & Sundarbans)
 *  7. Smart Port Tug-Scheduler & Berth Allocation Widget
 */
import { useState, useEffect, useCallback } from "react";
import {
  Fish, Waves, Anchor, AlertTriangle, ShieldAlert,
  Droplets, Activity, RefreshCw, Volume2, CheckCircle2,
  Navigation, Scan, Ship, Clock, MapPin, Zap,
  LifeBuoy, Leaf, Truck, Timer,
  ArrowRight, Radio, Lock, Unlock, ShieldCheck,
} from "lucide-react";
import { speak } from "../utils/speechEngine";

// ─── 5. Relief corridor data ──────────────────────────────────────────────────
const RELIEF_CORRIDORS = [
  {
    id: "RC-01",
    name: "Operation Bay Shield",
    from: "Chennai",
    to: "Visakhapatnam",
    cargo: "Medical Supplies · Potable Water · Rescue Rafts",
    status: "CLEAR",
    vessels: 3,
    escortHdg: "040°",
    eta: "14.2h",
    priority: "P1",
    cycloneRef: "BOB-CY-2026-04",
  },
  {
    id: "RC-02",
    name: "Operation Coastal Aid",
    from: "Paradip",
    to: "Haldia Emergency Dock",
    cargo: "Food Packs · Generator Sets · Field Hospital Kit",
    status: "FORMING",
    vessels: 2,
    escortHdg: "015°",
    eta: "8.7h",
    priority: "P2",
    cycloneRef: "BOB-CY-2026-04",
  },
  {
    id: "RC-03",
    name: "Operation Andhra Lifeline",
    from: "Tuticorin",
    to: "Krishnapatnam",
    cargo: "Shelter Material · Vaccines (cold chain) · Pumps",
    status: "STANDBY",
    vessels: 1,
    escortHdg: "350°",
    eta: "22.5h",
    priority: "P3",
    cycloneRef: "NE-CY-2026-01",
  },
];

const RELIEF_STATUS_CFG = {
  CLEAR:   { badge: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500"             },
  FORMING: { badge: "bg-amber-100 text-amber-800 border-amber-300",       dot: "bg-amber-500 animate-pulse" },
  STANDBY: { badge: "bg-sky-100 text-sky-800 border-sky-300",             dot: "bg-sky-500"                 },
  BLOCKED: { badge: "bg-red-100 text-red-800 border-red-300",             dot: "bg-red-500 animate-pulse"   },
};

const PRIORITY_CFG = {
  P1: "bg-red-500 text-white",
  P2: "bg-amber-500 text-white",
  P3: "bg-sky-500 text-white",
};

// ─── 6. Eco-zone data ────────────────────────────────────────────────────────
const ECO_ZONES = [
  {
    id: "EZ-01",
    name: "Gulf of Mannar Marine NP",
    type: "Marine National Park",
    restriction: "NO DISCHARGE · Speed ≤8 kts · No Anchoring",
    area: "560 km²",
    status: "ACTIVE",
  },
  {
    id: "EZ-02",
    name: "Sundarbans Biosphere",
    type: "UNESCO Biosphere Reserve",
    restriction: "AIS MANDATORY · Ballast Lock · No AHD Discharge",
    area: "9,630 km²",
    status: "ACTIVE",
  },
  {
    id: "EZ-03",
    name: "Andaman Coral Reserve",
    type: "Coral Protection Zone",
    restriction: "No Bottom Trawl · No Bilge Dump · Speed ≤6 kts",
    area: "320 km²",
    status: "SEASONAL",
  },
  {
    id: "EZ-04",
    name: "Chilika Lagoon ESA",
    type: "Ramsar Wetland",
    restriction: "No Wash · Eco-silent Engine Mode",
    area: "1,100 km²",
    status: "ACTIVE",
  },
];

// ─── 7. Tug scheduler data ───────────────────────────────────────────────────
const TUG_SCHEDULE_BASE = [
  {
    id: "TUG-VZG-01",
    tugName: "MT Vizag Hercules",
    port: "Visakhapatnam",
    berthSlot: "B-14",
    vessel: "MV Iron Condor",
    arrivalEta: "02:45",
    tugEta: "02:30",
    status: "CONFIRMED",
    pilotBoarded: true,
    draught: "13.2m",
  },
  {
    id: "TUG-VZG-02",
    tugName: "MT AP Navigator",
    port: "Visakhapatnam",
    berthSlot: "B-09",
    vessel: "MV Pacific Star",
    arrivalEta: "06:15",
    tugEta: "06:00",
    status: "PENDING",
    pilotBoarded: false,
    draught: "11.8m",
  },
  {
    id: "TUG-CHN-01",
    tugName: "MT Chennai King",
    port: "Chennai",
    berthSlot: "COT-3",
    vessel: "MV Coral Tide",
    arrivalEta: "04:00",
    tugEta: "03:45",
    status: "CONFIRMED",
    pilotBoarded: true,
    draught: "10.5m",
  },
  {
    id: "TUG-CHN-02",
    tugName: "MT Marina Power",
    port: "Chennai",
    berthSlot: "QCCT-7",
    vessel: "MV Bay Monarch",
    arrivalEta: "08:30",
    tugEta: "08:15",
    status: "DELAYED",
    pilotBoarded: false,
    draught: "12.1m",
  },
  {
    id: "TUG-PDG-01",
    tugName: "MT Paradip Pride",
    port: "Paradip",
    berthSlot: "COB-2",
    vessel: "MV Steel Eagle",
    arrivalEta: "11:00",
    tugEta: "10:45",
    status: "CONFIRMED",
    pilotBoarded: false,
    draught: "14.0m",
  },
];

const TUG_STATUS_CFG = {
  CONFIRMED: { badge: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500"             },
  PENDING:   { badge: "bg-sky-100 text-sky-800 border-sky-300",             dot: "bg-sky-400"                 },
  DELAYED:   { badge: "bg-red-100 text-red-800 border-red-300",             dot: "bg-red-500 animate-pulse"   },
  DEPARTED:  { badge: "bg-slate-100 text-slate-600 border-slate-300",       dot: "bg-slate-400"               },
};

// ─── 1. Fishing fleet data ────────────────────────────────────────────────────
const FISHING_FLEET = [
  { id: "FS-CH01", zone: "Chennai Coast",    prox: 0.8, speed: 4, type: "Catamaran",  risk: "CRITICAL" },
  { id: "FS-VZ02", zone: "Vizag Outer Roads",prox: 1.4, speed: 3, type: "Trawler",    risk: "HIGH"     },
  { id: "FS-TU03", zone: "Tuticorin Shoal",  prox: 2.1, speed: 5, type: "Vallam",     risk: "MEDIUM"   },
  { id: "FS-CH04", zone: "Chennai Harbour",  prox: 0.5, speed: 2, type: "Fibre Skiff", risk: "CRITICAL" },
  { id: "FS-KK05", zone: "Karaikkal Mouth",  prox: 3.4, speed: 6, type: "Motorboat",  risk: "LOW"      },
];

const RISK_STYLE = {
  CRITICAL: { badge: "bg-red-100 text-red-800 border-red-300",      dot: "bg-red-500 animate-pulse"  },
  HIGH:     { badge: "bg-amber-100 text-amber-800 border-amber-300", dot: "bg-amber-500"              },
  MEDIUM:   { badge: "bg-yellow-100 text-yellow-800 border-yellow-300", dot: "bg-yellow-500"          },
  LOW:      { badge: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500"      },
};

// ─── 2. Cyclone / Tsunami evasion data ───────────────────────────────────────
const CYCLONE_ALERTS = [
  { id: "CY1", name: "BOB Cyclone Watch",   lat: 15.5, lng: 88.0, intensity: "CAT-3", status: "ACTIVE",  safeHdg: "270° W"  },
  { id: "TS1", name: "Andaman Seismic",     lat: 12.5, lng: 93.5, intensity: "MAG-6.4",status: "WATCH",  safeHdg: "210° SW" },
  { id: "CY2", name: "NE Bay Cyclone",      lat: 20.0, lng: 92.0, intensity: "CAT-1", status: "FORMING", safeHdg: "180° S"  },
];

const EVASION_ROUTES = [
  { from: "Chennai",       to: "Deep Water 200m SE",  hdg: "145°", eta: "3.2h",  safe: true  },
  { from: "Visakhapatnam", to: "Andaman Ridge Anchor", hdg: "090°", eta: "8.1h",  safe: true  },
  { from: "Paradip",       to: "Bay South Refuge",    hdg: "180°", eta: "5.6h",  safe: false },
];

// ─── 3. Port congestion (EC-specific 5 ports) ────────────────────────────────
const EC_PORTS_BASE = [
  { id: "CHN", name: "Chennai",        queue: 7,  waitHrs: 6.2, berthFree: 0, status: "HIGH"     },
  { id: "VZG", name: "Visakhapatnam",  queue: 4,  waitHrs: 3.5, berthFree: 2, status: "MODERATE" },
  { id: "PDG", name: "Paradip",        queue: 6,  waitHrs: 5.1, berthFree: 1, status: "HIGH"     },
  { id: "HLD", name: "Haldia",         queue: 11, waitHrs: 9.8, berthFree: 0, status: "CRITICAL" },
  { id: "TUT", name: "Tuticorin",      queue: 2,  waitHrs: 1.8, berthFree: 3, status: "LOW"      },
];

const PORT_STATUS_STYLE = {
  CRITICAL: { bar: "bg-red-500",     badge: "bg-red-50 text-red-700 border-red-300"       },
  HIGH:     { bar: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-300" },
  MODERATE: { bar: "bg-sky-500",     badge: "bg-sky-50 text-sky-700 border-sky-300"       },
  LOW:      { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-300" },
};

// ─── 4. River debris / smuggling data ─────────────────────────────────────────
const RIVER_ZONES = [
  { id: "RZ1", river: "Hooghly / Ganga", zone: "Sagar Island Mouth", debris: "CRITICAL", psi: 82, smuggle: "HIGH"   },
  { id: "RZ2", river: "Godavari",        zone: "Kakinada Estuary",   debris: "HIGH",     psi: 61, smuggle: "MEDIUM" },
  { id: "RZ3", river: "Kaveri / Kollidam",zone: "Nagapattinam Delta",debris: "MEDIUM",   psi: 44, smuggle: "LOW"    },
  { id: "RZ4", river: "Mahanadi",        zone: "Paradip Mouth",      debris: "HIGH",     psi: 68, smuggle: "MEDIUM" },
];

// ─── Shared section header ────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, iconBg, title, subtitle, badge, badgeCls }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl border ${iconBg}`}>
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[11px] font-mono text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full border ${badgeCls}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Mini PSI arc ─────────────────────────────────────────────────────────────
function MiniPsi({ psi }) {
  const color = psi > 70 ? "#ef4444" : psi > 50 ? "#f97316" : "#22c55e";
  const pct   = Math.min(psi / 100, 1);
  const r = 14, cx = 18, cy = 18;
  const sa = Math.PI, ea = Math.PI + pct * Math.PI;
  const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
  const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
  const lg = pct > 0.5 ? 1 : 0;
  return (
    <svg viewBox="0 0 36 24" className="w-9 h-6 shrink-0">
      <path d={`M${x1},${y1} A${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
      <path d={`M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}`}
        fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="6" fontWeight="900"
        fontFamily="monospace" fill={color}>{psi}</text>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EastCoastModePanel({ language = "en" }) {
  const [ports,        setPorts]        = useState(EC_PORTS_BASE);
  const [scanActive,   setScanActive]   = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults,  setScanResults]  = useState(null);

  // Ballast valve lock state per eco-zone
  const [valveLocks, setValveLocks] = useState(() =>
    Object.fromEntries(ECO_ZONES.map((z) => [z.id, z.status === "ACTIVE"]))
  );
  const [ecoZoneActive, setEcoZoneActive] = useState(true); // simulate vessel inside eco-zone

  const toggleValve = useCallback((zoneId) => {
    setValveLocks((prev) => {
      const next = { ...prev, [zoneId]: !prev[zoneId] };
      const allLocked = Object.values(next).every(Boolean);
      speak(
        next[zoneId]
          ? `Ballast valve locked for eco-zone ${zoneId}. Discharge prevented.`
          : `Warning! Ballast valve manually unlocked for ${zoneId}. Monitor discharge compliance.`,
        language
      );
      return next;
    });
  }, [language]);

  // Live port queue drift
  useEffect(() => {
    const id = setInterval(() => {
      setPorts((prev) => prev.map((p) => {
        const dq  = Math.round((Math.random() - 0.48) * 2);
        const dw  = parseFloat(((Math.random() - 0.48) * 0.5).toFixed(1));
        const nq  = Math.max(0, p.queue + dq);
        const nw  = parseFloat(Math.max(0.3, p.waitHrs + dw).toFixed(1));
        const st  = nw < 2.5 ? "LOW" : nw < 5.0 ? "MODERATE" : nw < 8.0 ? "HIGH" : "CRITICAL";
        return { ...p, queue: nq, waitHrs: nw, status: st };
      }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const handleFleetAlert = useCallback((vessel) => {
    const msgs = {
      en: `Warning! Fishing vessel ${vessel.id} at ${vessel.prox} nautical miles in ${vessel.zone}. Reduce speed and stand by.`,
      ta: `எச்சரிக்கை! ${vessel.id} மீனவ கப்பல் ${vessel.prox} கடல் மைல் தொலைவில் உள்ளது. வேகம் குறைக்கவும்.`,
      hi: `चेतावनी! मछली पकड़ने वाली नाव ${vessel.id} ${vessel.prox} नॉटिकल मील दूर है। गति कम करें।`,
    };
    speak(msgs[language] ?? msgs.en, language);
  }, [language]);

  const runSmugglingScan = () => {
    setScanActive(true);
    setScanProgress(0);
    setScanResults(null);
    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setScanActive(false);
          setScanResults({
            anomaly: Math.random() > 0.6,
            density: (7.82 + Math.random() * 0.4).toFixed(2),
            zone: "Hooghly Outer Anchorage",
            confidence: Math.round(88 + Math.random() * 10),
          });
          return 100;
        }
        return p + 4;
      });
    }, 80);
  };

  return (
    <div className="space-y-5">

      {/* ── MODE BANNER ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl px-5 py-3.5
        flex flex-wrap items-center gap-3 shadow-md shadow-sky-200">
        <Anchor size={18} className="text-white shrink-0" />
        <div>
          <p className="text-white font-black text-sm tracking-tight">
            East Coast India Corridor — Primary Mode Active
          </p>
          <p className="text-sky-100 text-[11px] font-mono">
            Bay of Bengal · Coastal Safety · EC Port Intelligence · 80% Focus
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-white/20 border border-white/30 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            <Activity size={9} className="animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ── MODULE 1: FISHING FLEET RADAR ─────────────────────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <SectionHeader
            icon={Fish}
            iconBg="bg-cyan-50 border-cyan-200 text-cyan-700"
            title="Small Fishing Fleet Collision Radar"
            subtitle="Chennai · Vizag · Tuticorin coastal waters"
            badge={`${FISHING_FLEET.filter(f => f.risk === "CRITICAL").length} CRITICAL`}
            badgeCls="bg-red-100 text-red-800 border-red-300"
          />
          <div className="space-y-2">
            {FISHING_FLEET.map((vessel) => {
              const rs = RISK_STYLE[vessel.risk];
              return (
                <button
                  key={vessel.id}
                  type="button"
                  onClick={() => handleFleetAlert(vessel)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                    border border-sky-100 hover:border-sky-300 bg-sky-50/40
                    hover:bg-sky-50 transition-all cursor-pointer text-left"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${rs.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold font-mono text-slate-800">{vessel.id}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${rs.badge}`}>
                        {vessel.risk}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 truncate">{vessel.zone} · {vessel.type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black font-mono text-sky-700">{vessel.prox} NM</div>
                    <div className="text-[9px] font-mono text-slate-400">{vessel.speed} kts</div>
                  </div>
                  <Volume2 size={12} className="text-sky-400 shrink-0" />
                </button>
              );
            })}
          </div>
          <p className="text-[9px] font-mono text-slate-400 mt-3">
            Click any vessel → voice alert in EN / தமிழ் / हिंदी
          </p>
        </div>

        {/* ── MODULE 2: CYCLONE & TSUNAMI EVASION ──────────────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <SectionHeader
            icon={Waves}
            iconBg="bg-red-50 border-red-200 text-red-600"
            title="Bay of Bengal Cyclone & Tsunami Evasion"
            subtitle="Live seismic + meteorological alerts · Safe trajectory routing"
            badge="3 ACTIVE"
            badgeCls="bg-red-100 text-red-800 border-red-300"
          />

          {/* Alert list */}
          <div className="space-y-2 mb-4">
            {CYCLONE_ALERTS.map((alert) => (
              <div key={alert.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                  alert.status === "ACTIVE"
                    ? "bg-red-50 border-red-200"
                    : alert.status === "WATCH"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-sky-50 border-sky-200"
                }`}>
                <span className="text-lg shrink-0">
                  {alert.name.includes("Seismic") ? "🌊" : "🌀"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-900">{alert.name}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${
                      alert.status === "ACTIVE"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : alert.status === "WATCH"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-sky-100 text-sky-800 border-sky-300"
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">{alert.intensity}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-black font-mono text-emerald-700">{alert.safeHdg}</div>
                  <div className="text-[9px] font-mono text-slate-400">Safe hdg</div>
                </div>
              </div>
            ))}
          </div>

          {/* Evasion route table */}
          <div className="border border-sky-100 rounded-xl overflow-hidden">
            <div className="bg-sky-50 px-3 py-1.5 text-[9px] font-black font-mono uppercase tracking-wider text-slate-400 border-b border-sky-100">
              Green Safe Trajectories
            </div>
            {EVASION_ROUTES.map((r) => (
              <div key={r.from}
                className="flex items-center gap-3 px-3 py-2 border-b last:border-0 border-sky-50">
                <Navigation size={11} className={r.safe ? "text-emerald-500" : "text-amber-500"} />
                <div className="flex-1 min-w-0 text-[10px] font-mono">
                  <span className="font-bold text-slate-800">{r.from}</span>
                  <span className="text-slate-400"> → {r.to}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                  <span className="text-sky-700 font-bold">{r.hdg}</span>
                  <span className="text-slate-400">{r.eta}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                    r.safe
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}>
                    {r.safe ? "✓ CLEAR" : "⚠ CAUTION"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MODULE 3: EC PORT CONGESTION MINI-TRACKER ────────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <SectionHeader
            icon={Anchor}
            iconBg="bg-sky-50 border-sky-200 text-sky-700"
            title="East Coast Port Congestion Tracker"
            subtitle="Chennai · Vizag · Paradip · Haldia · Tuticorin · Live queue"
          />
          <div className="space-y-2.5">
            {ports.map((port) => {
              const st  = PORT_STATUS_STYLE[port.status];
              const barW = Math.min((port.waitHrs / 12) * 100, 100);
              return (
                <div key={port.id} className="flex items-center gap-3">
                  {/* Port name */}
                  <div className="w-28 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={9} className="text-sky-500 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-800 truncate">{port.name}</span>
                    </div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border inline-block mt-0.5 ${st.badge}`}>
                      {port.status}
                    </span>
                  </div>
                  {/* Wait bar */}
                  <div className="flex-1">
                    <div className="h-2 bg-sky-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${st.bar}`}
                        style={{ width: `${barW}%` }} />
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <div className="text-[11px] font-black font-mono text-slate-900">{port.queue}</div>
                      <div className="text-[8px] font-mono text-slate-400">ships</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black font-mono text-amber-700">{port.waitHrs}h</div>
                      <div className="text-[8px] font-mono text-slate-400">est wait</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-black font-mono ${
                        port.berthFree > 0 ? "text-emerald-700" : "text-red-600"
                      }`}>
                        {port.berthFree > 0 ? port.berthFree : "FULL"}
                      </div>
                      <div className="text-[8px] font-mono text-slate-400">berths</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[9px] font-mono text-slate-400">
            <Activity size={9} className="text-emerald-500 animate-pulse" />
            Live queue updates every 5s
          </div>
        </div>

        {/* ── MODULE 4: RIVER DEBRIS + ANTI-SMUGGLING SCAN ─────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <SectionHeader
            icon={Scan}
            iconBg="bg-amber-50 border-amber-200 text-amber-700"
            title="River Debris & Anti-Smuggling Scanner"
            subtitle="Hooghly · Godavari · Kaveri · Mahanadi river mouths"
          />

          {/* River zone table */}
          <div className="space-y-2 mb-4">
            {RIVER_ZONES.map((rz) => (
              <div key={rz.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-sky-100
                  bg-sky-50/30 hover:bg-sky-50/60 transition-all">
                <Droplets size={13} className="text-sky-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-800">{rz.river}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                      rz.debris === "CRITICAL"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : rz.debris === "HIGH"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-yellow-100 text-yellow-800 border-yellow-300"
                    }`}>
                      Debris: {rz.debris}
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 truncate">{rz.zone}</p>
                </div>
                <MiniPsi psi={rz.psi} />
                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                  rz.smuggle === "HIGH"
                    ? "bg-red-100 text-red-700 border-red-300"
                    : rz.smuggle === "MEDIUM"
                    ? "bg-amber-100 text-amber-700 border-amber-300"
                    : "bg-emerald-100 text-emerald-700 border-emerald-300"
                }`}>
                  ASD: {rz.smuggle}
                </div>
              </div>
            ))}
          </div>

          {/* Hull density scan control */}
          <div className="bg-slate-900 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black font-mono text-emerald-400 flex items-center gap-1.5">
                <ShieldAlert size={11} />
                HULL MASS DENSITY SCANNER
              </span>
              <button
                type="button"
                onClick={runSmugglingScan}
                disabled={scanActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer
                  transition-all border ${scanActive
                    ? "bg-emerald-900 border-emerald-700 text-emerald-400 animate-pulse"
                    : "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500"
                  }`}
              >
                {scanActive
                  ? <><RefreshCw size={10} className="animate-spin" /> Scanning…</>
                  : <><Zap size={10} /> Run Density Scan</>
                }
              </button>
            </div>

            {/* Progress bar */}
            {scanActive && (
              <div className="mb-2">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }} />
                </div>
                <p className="text-[9px] font-mono text-slate-400 mt-1">
                  Acoustic sonar sweep… {scanProgress}%
                </p>
              </div>
            )}

            {/* Scan results */}
            {scanResults && !scanActive && (
              <div className={`rounded-lg px-3 py-2 border ${
                scanResults.anomaly
                  ? "bg-red-950/40 border-red-700"
                  : "bg-emerald-950/30 border-emerald-700"
              }`}>
                <div className={`text-[10px] font-black font-mono mb-1 ${
                  scanResults.anomaly ? "text-red-400" : "text-emerald-400"
                }`}>
                  {scanResults.anomaly ? "⚠ ANOMALY DETECTED" : "✓ HULL SCAN CLEAR"}
                </div>
                <div className="text-[9px] font-mono text-slate-400 space-y-0.5">
                  <div>Zone: <span className="text-slate-300">{scanResults.zone}</span></div>
                  <div>Density: <span className={scanResults.anomaly ? "text-red-300" : "text-emerald-300"}>
                    {scanResults.density} g/cm³
                  </span></div>
                  <div>Confidence: <span className="text-slate-300">{scanResults.confidence}%</span></div>
                </div>
              </div>
            )}

            {!scanResults && !scanActive && (
              <p className="text-[9px] font-mono text-slate-500">
                Awaiting scan — coastal customs anomaly detection ready
              </p>
            )}
          </div>
        </div>

      </div>

      {/* ══ ROW 2: three new modules in a 3-col grid ══════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── MODULE 5: CYCLONE RELIEF CORRIDOR ROUTER ──────────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <SectionHeader
            icon={LifeBuoy}
            iconBg="bg-rose-50 border-rose-200 text-rose-600"
            title="Cyclone Disaster Relief Corridor"
            subtitle="Bay of Bengal emergency supply routing · IMO IMDG Class 6.2"
          />

          <div className="space-y-3">
            {RELIEF_CORRIDORS.map((rc) => {
              const scfg = RELIEF_STATUS_CFG[rc.status];
              return (
                <div key={rc.id}
                  className={`rounded-xl border p-3 transition-all ${
                    rc.status === "CLEAR"
                      ? "bg-emerald-50/60 border-emerald-200"
                      : rc.status === "FORMING"
                      ? "bg-amber-50/60 border-amber-200"
                      : "bg-sky-50/40 border-sky-200"
                  }`}>
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${scfg.dot}`} />
                    <span className="text-[11px] font-black text-slate-900">{rc.name}</span>
                    <span className={`ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-full ${PRIORITY_CFG[rc.priority]}`}>
                      {rc.priority}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${scfg.badge}`}>
                      {rc.status}
                    </span>
                  </div>
                  {/* Route */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-sky-700 mb-1.5">
                    <span>{rc.from}</span>
                    <ArrowRight size={11} className="text-sky-400 shrink-0" />
                    <span>{rc.to}</span>
                  </div>
                  {/* Cargo */}
                  <p className="text-[9px] font-mono text-slate-500 mb-2 leading-tight">
                    📦 {rc.cargo}
                  </p>
                  {/* Stats */}
                  <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500 flex-wrap">
                    <span><span className="font-black text-slate-700">{rc.vessels}</span> vessels</span>
                    <span>Hdg <span className="font-black text-sky-700">{rc.escortHdg}</span></span>
                    <span>ETA <span className="font-black text-emerald-700">{rc.eta}</span></span>
                    <span className="ml-auto text-[8px] text-slate-400">Ref: {rc.cycloneRef}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            <Radio size={12} className="text-rose-500 animate-pulse shrink-0" />
            <p className="text-[9px] font-mono text-rose-700">
              VHF Ch.16 monitoring active · NDMA coordination enabled · All corridors cleared with Coast Guard
            </p>
          </div>
        </div>

        {/* ── MODULE 6: ECO-SENSITIVE GEOFENCING ────────────────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <SectionHeader
            icon={Leaf}
            iconBg="bg-emerald-50 border-emerald-200 text-emerald-700"
            title="Eco-Sensitive Geofencing"
            subtitle="Gulf of Mannar · Sundarbans · Andaman Coral · Chilika Lagoon"
          />

          {/* Vessel-in-zone banner */}
          <button
            type="button"
            onClick={() => setEcoZoneActive((v) => !v)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border mb-3 cursor-pointer transition-all
              ${ecoZoneActive
                ? "bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
              }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${ecoZoneActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <span className={`text-[10px] font-black font-mono flex-1 text-left ${ecoZoneActive ? "text-emerald-800" : "text-slate-500"}`}>
              {ecoZoneActive ? "🟢 VESSEL INSIDE ECO-ZONE" : "⚪ Vessel outside protected zones"}
            </span>
            <span className="text-[9px] font-mono text-slate-400">Toggle</span>
          </button>

          {/* Zone cards with per-zone valve lock toggle */}
          <div className="space-y-2 mb-4">
            {ECO_ZONES.map((ez) => {
              const locked = valveLocks[ez.id];
              return (
                <div key={ez.id}
                  className={`rounded-xl border p-2.5 transition-all ${
                    ecoZoneActive && locked
                      ? "bg-emerald-50/60 border-emerald-200"
                      : ecoZoneActive && !locked
                      ? "bg-rose-50/40 border-rose-200"
                      : "bg-sky-50/30 border-sky-100"
                  }`}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm mt-0.5 shrink-0">🌿</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[11px] font-bold text-slate-900">{ez.name}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                          ez.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}>{ez.status}</span>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 mb-0.5">{ez.type} · {ez.area}</p>
                      <p className="text-[9px] font-mono font-bold text-emerald-700 leading-tight">{ez.restriction}</p>
                    </div>

                    {/* Ballast valve lock toggle */}
                    <button
                      type="button"
                      onClick={() => toggleValve(ez.id)}
                      title={locked ? "Click to unlock ballast valve" : "Click to lock ballast valve"}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border cursor-pointer transition-all shrink-0
                        ${locked
                          ? "bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200"
                          : "bg-rose-100 border-rose-300 text-rose-700 hover:bg-rose-200"
                        }`}
                    >
                      {locked
                        ? <Lock size={12} />
                        : <Unlock size={12} />
                      }
                      <span className="text-[7px] font-black font-mono leading-none">
                        {locked ? "LOCKED" : "OPEN"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary valve status banner */}
          {ecoZoneActive && (
            <div className={`rounded-xl px-3 py-2.5 border flex items-start gap-2 ${
              Object.values(valveLocks).every(Boolean)
                ? "bg-emerald-50 border-emerald-300"
                : "bg-rose-50 border-rose-300"
            }`}>
              {Object.values(valveLocks).every(Boolean)
                ? <ShieldCheck size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                : <AlertTriangle size={13} className="text-rose-600 shrink-0 mt-0.5 animate-pulse" />
              }
              <div className="min-w-0">
                <p className={`text-[10px] font-black font-mono ${
                  Object.values(valveLocks).every(Boolean) ? "text-emerald-800" : "text-rose-800"
                }`}>
                  {Object.values(valveLocks).every(Boolean)
                    ? "✓ ALL BALLAST VALVES LOCKED — Eco-zone compliant"
                    : `⚠ ${Object.values(valveLocks).filter(v => !v).length} VALVE(S) UNLOCKED — Discharge risk`
                  }
                </p>
                <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                  Speed ≤8 kts · AIS mandatory · Eco-silent engine mode · IMO MARPOL Annex V
                </p>
              </div>
            </div>
          )}

          <p className="text-[9px] font-mono text-slate-400 mt-2.5 flex items-center gap-1.5">
            <Leaf size={9} className="text-emerald-500" />
            Eco-zone polygons visible on GeoNav canvas → Layer 7 (Overlays panel)
          </p>
        </div>

        {/* ── MODULE 7: SMART TUG-SCHEDULER & BERTH WIDGET ─────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <SectionHeader
            icon={Anchor}
            iconBg="bg-violet-50 border-violet-200 text-violet-700"
            title="Smart Tug-Scheduler & Berth Allocator"
            subtitle="Visakhapatnam · Chennai · Paradip · Live ETA slots"
          />

          <div className="space-y-2.5">
            {TUG_SCHEDULE_BASE.map((slot) => {
              const scfg = TUG_STATUS_CFG[slot.status];
              return (
                <div key={slot.id}
                  className={`rounded-xl border p-3 transition-all hover:shadow-sm ${
                    slot.status === "CONFIRMED"
                      ? "bg-emerald-50/40 border-emerald-200"
                      : slot.status === "DELAYED"
                      ? "bg-red-50/40 border-red-200"
                      : "bg-sky-50/30 border-sky-200"
                  }`}>
                  {/* Top row */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${scfg.dot}`} />
                    <span className="text-[10px] font-bold font-mono text-slate-800 truncate flex-1">
                      {slot.vessel}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${scfg.badge}`}>
                      {slot.status}
                    </span>
                  </div>
                  {/* Port + berth */}
                  <div className="flex items-center gap-2 text-[10px] font-mono mb-1.5">
                    <MapPin size={9} className="text-sky-500 shrink-0" />
                    <span className="text-slate-600">{slot.port}</span>
                    <span className="font-black text-violet-700">Berth {slot.berthSlot}</span>
                  </div>
                  {/* Tug + timing */}
                  <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Truck size={9} className="text-violet-400" />
                      {slot.tugName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer size={9} className="text-amber-500" />
                      Tug: <span className="font-black text-amber-700 ml-0.5">{slot.tugEta}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Ship size={9} className="text-sky-500" />
                      ETA: <span className="font-black text-sky-700 ml-0.5">{slot.arrivalEta}</span>
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      {slot.pilotBoarded
                        ? <><CheckCircle2 size={9} className="text-emerald-500" /> Pilot ✓</>
                        : <><Clock size={9} className="text-amber-500" /> Pilot ETA</>
                      }
                    </span>
                  </div>
                  {/* Draught */}
                  <div className="mt-1.5 text-[8px] font-mono text-slate-400">
                    Arrival draught: <span className="font-bold text-slate-600">{slot.draught}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[9px] font-mono text-slate-400">
            <Activity size={9} className="text-emerald-500 animate-pulse" />
            VTS coordination active · Port authority confirmed slots
          </div>
        </div>

      </div>
    </div>
  );
}
