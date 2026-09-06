/**
 * IcebergCollisionSuite — Arctic Nav-Radar & Thermal Sonar Engine
 * Sky Blue Light Theme · White cards · Cyan-50 header tint
 *
 * Features:
 *  - SVG Arctic radar canvas with pulsing iceberg hazard markers
 *  - Fog density gauge with visibility percentage
 *  - Sub-surface ice depth sonar bar (animated)
 *  - Auto-course diverter: dashed green safe trajectory around red iceberg blobs
 *  - Thermal camera feed simulation (canvas-drawn heat signature grid)
 *  - Speed-cut / reverse-thruster emergency panel
 *  - Voice alerts in English, Tamil, Hindi via speechEngine
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Snowflake, EyeOff, Compass, ShieldAlert, Navigation, Activity,
  AlertTriangle, RefreshCw, Volume2, VolumeX, Zap, Anchor,
  ThermometerSnowflake, Radio, Power, RotateCcw,
} from "lucide-react";
import { speak } from "../utils/speechEngine";

// ─── Static iceberg hazard data ───────────────────────────────────────────────
const ICEBERGS = [
  { id: "ICE-01", x: 310, y: 155, dist: 2.4,  size: 28, subDepth: 74, risk: "CRITICAL", label: "Growler Cluster A" },
  { id: "ICE-02", x: 480, y: 210, dist: 5.1,  size: 20, subDepth: 52, risk: "HIGH",     label: "Bergy Bit Zone B"  },
  { id: "ICE-03", x: 620, y: 130, dist: 8.7,  size: 16, subDepth: 38, risk: "MEDIUM",   label: "Pack Ice Shelf C"   },
  { id: "ICE-04", x: 200, y: 280, dist: 11.3, size: 13, subDepth: 29, risk: "LOW",      label: "Distant Ice Mass D" },
];

const SAFE_WAYPOINTS = [
  { x: 160, y: 300 },
  { x: 230, y: 250 },
  { x: 270, y: 190 },  // avoid ICE-01
  { x: 360, y: 150 },
  { x: 430, y: 170 },  // thread between ICE-01 & ICE-02
  { x: 530, y: 190 },
  { x: 590, y: 155 },
  { x: 670, y: 120 },
  { x: 760, y: 130 },
];

const VESSEL_START = { x: 110, y: 300 };
const VESSEL_END   = { x: 800, y: 125 };

const RISK_CONFIG = {
  CRITICAL: { fill: "#fef2f2", stroke: "#ef4444", badge: "bg-red-100 text-red-800 border-red-300",    pulse: true  },
  HIGH:     { fill: "#fff7ed", stroke: "#f97316", badge: "bg-amber-100 text-amber-800 border-amber-300", pulse: false },
  MEDIUM:   { fill: "#fefce8", stroke: "#eab308", badge: "bg-yellow-100 text-yellow-800 border-yellow-300", pulse: false },
  LOW:      { fill: "#f0fdf4", stroke: "#22c55e", badge: "bg-green-100 text-green-700 border-green-300", pulse: false },
};

// ─── ICE ALERT PHRASES (en / ta / hi) ────────────────────────────────────────
const ICE_PHRASES = {
  en: {
    sonarActivated: () => "Iceberg Thermal Sonar activated. Scanning sub-surface ice hazards in Arctic corridor.",
    iceDetected:    (id, dist) => `Warning! Iceberg ${id} detected at ${dist} nautical miles. Auto-course diversion initiated.`,
    speedCut:       () => "Emergency speed reduction engaged. Reverse thrusters online. Vessel slowing to 4 knots.",
    fogAlert:       (pct) => `Extreme fog alert. Visibility reduced to ${pct} percent. All crew to collision-watch stations.`,
    allClear:       () => "Arctic corridor scan complete. No immediate ice hazards detected. Safe passage confirmed.",
    sonarDeactivated: () => "Thermal sonar deactivated. Manual ice watch required.",
  },
  ta: {
    sonarActivated: () => "பனிப்பாறை வெப்ப சோனார் செயல்படுத்தப்பட்டது. ஆர்க்டிக் பாதையில் ஆழ்கடல் பனி ஆபத்துகள் ஸ்கேன் செய்யப்படுகின்றன.",
    iceDetected:    (id, dist) => `எச்சரிக்கை! ${id} பனிப்பாறை ${dist} கடல் மைல் தொலைவில் கண்டறியப்பட்டது. தானியங்கி பாதை திருப்புதல் தொடங்கப்பட்டது.`,
    speedCut:       () => "அவசர வேக குறைப்பு செயல்படுத்தப்பட்டது. தலைகீழ் உந்துவிசை ஆன்லைன். கப்பல் 4 நாட்டிக்கல் மைல் வரை குறைகிறது.",
    fogAlert:       (pct) => `கடுமையான மூட எச்சரிக்கை. தெரிவுத்திறன் ${pct} சதவீதமாக குறைந்துள்ளது. அனைத்து பணியாளர்களும் மோதல் கண்காணிப்பு நிலைக்கு வரவும்.`,
    allClear:       () => "ஆர்க்டிக் பாதை ஸ்கேன் முடிந்தது. உடனடி பனி ஆபத்துகள் இல்லை. பாதுகாப்பான பயணம் உறுதிப்படுத்தப்பட்டது.",
    sonarDeactivated: () => "வெப்ப சோனார் முடக்கப்பட்டது. கைமுறை பனி கண்காணிப்பு தேவை.",
  },
  hi: {
    sonarActivated: () => "आइसबर्ग थर्मल सोनार सक्रिय। आर्कटिक गलियारे में उप-सतह बर्फ खतरों की स्कैनिंग हो रही है।",
    iceDetected:    (id, dist) => `चेतावनी! आइसबर्ग ${id} ${dist} नॉटिकल मील की दूरी पर पाया गया। स्वचालित मार्ग विचलन शुरू हो गया।`,
    speedCut:       () => "आपातकालीन गति कटौती लागू। रिवर्स थ्रस्टर ऑनलाइन। जहाज 4 नॉट तक धीमा हो रहा है।",
    fogAlert:       (pct) => `अत्यधिक धुंध चेतावनी। दृश्यता ${pct} प्रतिशत तक घट गई। सभी दल टक्कर-निगरानी पर आएं।`,
    allClear:       () => "आर्कटिक गलियारा स्कैन पूरा। कोई तत्काल बर्फ खतरा नहीं। सुरक्षित मार्ग की पुष्टि।",
    sonarDeactivated: () => "थर्मल सोनार निष्क्रिय। मैन्युअल बर्फ निगरानी आवश्यक।",
  },
};

function iceSpeak(key, lang = "en", ...args) {
  const builder = ICE_PHRASES[lang]?.[key] ?? ICE_PHRASES.en[key];
  if (builder) speak(builder(...args), lang);
}

// ─── Animated pulse ring ──────────────────────────────────────────────────────
function PulseRing({ cx, cy, r, color }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r * 1.8} fill="none" stroke={color} strokeWidth="1" opacity="0.3"
        style={{ animation: "iceRingPulse 1.8s ease-out infinite" }} />
      <circle cx={cx} cy={cy} r={r * 2.5} fill="none" stroke={color} strokeWidth="0.5" opacity="0.15"
        style={{ animation: "iceRingPulse 1.8s ease-out 0.4s infinite" }} />
    </>
  );
}

// ─── Sonar sweep line ─────────────────────────────────────────────────────────
function SonarSweep({ cx, cy, active }) {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setAngle((a) => (a + 2) % 360), 30);
    return () => clearInterval(id);
  }, [active]);
  if (!active) return null;
  const rad = (angle * Math.PI) / 180;
  const x2 = cx + Math.cos(rad) * 360;
  const y2 = cy + Math.sin(rad) * 220;
  return (
    <line x1={cx} y1={cy} x2={x2} y2={y2}
      stroke="#06b6d4" strokeWidth="1.5" opacity="0.55"
      strokeLinecap="round" />
  );
}

// ─── Thermal grid heatmap (canvas) ───────────────────────────────────────────
function ThermalCamera({ icebergs, active }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    // Dark background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
    if (!active) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#475569";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("THERMAL CAMERA OFFLINE", W / 2, H / 2 - 8);
      ctx.fillStyle = "#334155";
      ctx.font = "10px monospace";
      ctx.fillText("Activate sonar to enable feed", W / 2, H / 2 + 10);
      return;
    }
    // Thermal gradient noise grid
    const cellW = 12, cellH = 10;
    for (let y = 0; y < H; y += cellH) {
      for (let x = 0; x < W; x += cellW) {
        const cold = Math.random();
        let r, g, b;
        if (cold < 0.55) { // cold / ice — deep blue-teal
          r = Math.floor(0   + cold * 40);
          g = Math.floor(80  + cold * 120);
          b = Math.floor(180 + cold * 60);
        } else if (cold < 0.80) { // mid temp
          r = Math.floor(cold * 140);
          g = Math.floor(cold * 200);
          b = Math.floor(100 + cold * 60);
        } else { // warm vessel hull — amber
          r = Math.floor(200 + cold * 55);
          g = Math.floor(130 + cold * 60);
          b = 30;
        }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, cellW - 1, cellH - 1);
      }
    }
    // Overlay ice hazard blobs (cold = bright cyan/white)
    icebergs.forEach((ice) => {
      const tx = (ice.x / 900) * W;
      const ty = (ice.y / 420) * H;
      const grad = ctx.createRadialGradient(tx, ty, 2, tx, ty, ice.size * 1.4);
      grad.addColorStop(0, "rgba(220,240,255,0.95)");
      grad.addColorStop(0.5, "rgba(100,200,255,0.6)");
      grad.addColorStop(1, "rgba(0,180,220,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tx, ty, ice.size * 1.4, 0, Math.PI * 2);
      ctx.fill();
      // Label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(ice.id, tx, ty + ice.size * 1.4 + 8);
    });
    // Vessel heat signature (amber blob bottom-left)
    const vx = 35, vy = H - 35;
    const vGrad = ctx.createRadialGradient(vx, vy, 3, vx, vy, 28);
    vGrad.addColorStop(0, "rgba(255,200,50,0.9)");
    vGrad.addColorStop(0.6, "rgba(255,100,0,0.5)");
    vGrad.addColorStop(1, "rgba(200,50,0,0)");
    ctx.fillStyle = vGrad;
    ctx.beginPath();
    ctx.arc(vx, vy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.fillText("OWN VESSEL", vx, vy + 33);
  }, [active, icebergs]);

  return (
    <canvas ref={canvasRef} width={260} height={160}
      className="rounded-xl w-full border border-cyan-200"
      style={{ imageRendering: "pixelated" }} />
  );
}

// ─── Sub-surface depth bar ────────────────────────────────────────────────────
function SonarDepthBar({ ice, active }) {
  const pct = active ? Math.min((ice.subDepth / 100) * 100, 100) : 0;
  const color = ice.subDepth > 60 ? "#ef4444" : ice.subDepth > 40 ? "#f97316" : "#eab308";
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono">
      <span className="text-slate-500 w-24 shrink-0 truncate">{ice.id}</span>
      <div className="flex-1 h-3 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-14 text-right shrink-0" style={{ color }}>
        {active ? `${ice.subDepth}m` : "---"}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IcebergCollisionSuite({ language = "en" }) {
  const [sonarActive,     setSonarActive]     = useState(false);
  const [speedCutActive,  setSpeedCutActive]  = useState(false);
  const [selectedIce,     setSelectedIce]     = useState(null);
  const [visibility,      setVisibility]      = useState(42);      // %
  const [fogScan,         setFogScan]         = useState(false);
  const [showDiverter,    setShowDiverter]    = useState(true);
  const [vesselPos,       setVesselPos]       = useState(0);        // 0–1 along path
  const [muted,           setMuted]           = useState(false);
  const [scanLog,         setScanLog]         = useState([]);
  const [allClear,        setAllClear]        = useState(false);
  const animRef = useRef(null);

  const logEntry = useCallback((msg) => {
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setScanLog((l) => [`[${ts}] ${msg}`, ...l].slice(0, 12));
  }, []);

  // Vessel animation along safe path
  useEffect(() => {
    if (!sonarActive) {
      cancelAnimationFrame(animRef.current);
      setVesselPos(0);
      return;
    }
    let t = 0;
    const step = () => {
      t = (t + 0.0015) % 1;
      setVesselPos(t);
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [sonarActive]);

  // Fog simulation loop
  useEffect(() => {
    if (!fogScan) return;
    const id = setInterval(() => {
      setVisibility((v) => {
        const next = Math.max(5, Math.min(95, v + (Math.random() - 0.52) * 8));
        return parseFloat(next.toFixed(1));
      });
    }, 1800);
    return () => clearInterval(id);
  }, [fogScan]);

  const handleSonar = () => {
    const next = !sonarActive;
    setSonarActive(next);
    setAllClear(false);
    if (!muted) iceSpeak(next ? "sonarActivated" : "sonarDeactivated", language);
    logEntry(next ? "Thermal sonar ACTIVATED — sub-surface scan in progress" : "Thermal sonar DEACTIVATED");
    if (next) {
      setTimeout(() => {
        logEntry("ICE-01 Growler Cluster detected at 2.4 NM — CRITICAL risk");
        logEntry("ICE-02 Bergy Bit detected at 5.1 NM — HIGH risk");
        logEntry("Auto-course diverter engaged — safe trajectory plotted");
        if (!muted) iceSpeak("iceDetected", language, "ICE-01", "2.4");
      }, 1400);
    }
  };

  const handleSpeedCut = () => {
    setSpeedCutActive(true);
    if (!muted) iceSpeak("speedCut", language);
    logEntry("EMERGENCY — Reverse thrusters engaged. Speed cut to 4 kts");
    setTimeout(() => setSpeedCutActive(false), 6000);
  };

  const handleFogScan = () => {
    const next = !fogScan;
    setFogScan(next);
    logEntry(next ? "Fog density scan ENABLED" : "Fog density scan DISABLED");
    if (next && !muted) iceSpeak("fogAlert", language, visibility.toFixed(0));
  };

  const handleSelectIce = (ice) => {
    setSelectedIce((prev) => prev?.id === ice.id ? null : ice);
    if (!muted) iceSpeak("iceDetected", language, ice.id, ice.dist.toString());
    logEntry(`Selected hazard: ${ice.id} — ${ice.label} at ${ice.dist} NM`);
  };

  const handleAllClear = () => {
    setAllClear(true);
    setSelectedIce(null);
    if (!muted) iceSpeak("allClear", language);
    logEntry("All-clear scan complete — no immediate hazards in corridor");
    setTimeout(() => setAllClear(false), 5000);
  };

  // Interpolate vessel position along SAFE_WAYPOINTS
  const getVesselXY = (t) => {
    const pts = SAFE_WAYPOINTS;
    const total = pts.length - 1;
    const seg   = Math.min(Math.floor(t * total), total - 1);
    const frac  = t * total - seg;
    const a = pts[seg], b = pts[seg + 1] ?? pts[total];
    return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
  };

  const vPos = getVesselXY(vesselPos);

  // Safe path polyline string
  const safePathD = SAFE_WAYPOINTS.reduce((acc, p, i) =>
    acc + (i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`), "");

  // Visibility color
  const visColor = visibility < 20 ? "#ef4444" : visibility < 40 ? "#f97316" : visibility < 60 ? "#eab308" : "#22c55e";
  const visLabel = visibility < 20 ? "EXTREME FOG" : visibility < 40 ? "DENSE FOG" : visibility < 60 ? "PATCHY FOG" : "CLEAR";

  return (
    <>
      {/* Inject keyframe for pulse ring */}
      <style>{`
        @keyframes iceRingPulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          60%  { transform: scale(1.4); opacity: 0.1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes icebergFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-3px); }
        }
      `}</style>

      <div className="space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-cyan-50 border-b border-cyan-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-100 border border-cyan-200 rounded-xl">
                <Snowflake size={20} className="text-cyan-700" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-cyan-900 tracking-tight">
                  Arctic Nav-Radar · Iceberg & Fog Collision Avoidance Suite
                </h2>
                <p className="text-[11px] font-mono text-cyan-600 mt-0.5">
                  Thermal Sonar · Sub-Surface Depth Radar · Auto-Course Diverter · Fog Density Engine
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mute toggle */}
              <button type="button" onClick={() => setMuted((m) => !m)}
                className="p-2 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 transition-all cursor-pointer"
                title={muted ? "Unmute alerts" : "Mute alerts"}>
                {muted ? <VolumeX size={14} className="text-slate-400" /> : <Volume2 size={14} className="text-sky-500" />}
              </button>
              {/* Status chips */}
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border transition-all
                ${sonarActive ? "bg-cyan-50 border-cyan-300 text-cyan-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sonarActive ? "bg-cyan-500 animate-pulse" : "bg-slate-300"}`} />
                SONAR {sonarActive ? "ACTIVE" : "STANDBY"}
              </span>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border
                ${allClear ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-rose-50 border-rose-300 text-rose-700"}`}>
                {allClear ? "✓ ALL CLEAR" : "⚠ ICE HAZARDS"}
              </span>
            </div>
          </div>

          {/* ── Control Strip ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-sky-100 bg-sky-50/40">
            <button type="button" onClick={handleSonar}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm
                ${sonarActive
                  ? "bg-cyan-500 border-cyan-600 text-white shadow-cyan-200"
                  : "bg-white border-sky-200 text-sky-700 hover:bg-sky-50"}`}>
              <ThermometerSnowflake size={13} />
              {sonarActive ? "Deactivate Thermal Sonar" : "Activate Iceberg Thermal Sonar"}
            </button>

            <button type="button" onClick={handleFogScan}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm
                ${fogScan
                  ? "bg-violet-500 border-violet-600 text-white"
                  : "bg-white border-sky-200 text-violet-700 hover:bg-violet-50"}`}>
              <EyeOff size={13} />
              {fogScan ? "Fog Scan ON" : "Enable Fog Density Scan"}
            </button>

            <button type="button" onClick={() => setShowDiverter((d) => !d)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm
                ${showDiverter
                  ? "bg-emerald-500 border-emerald-600 text-white"
                  : "bg-white border-sky-200 text-emerald-700 hover:bg-emerald-50"}`}>
              <Navigation size={13} />
              {showDiverter ? "Diverter ON" : "Show Course Diverter"}
            </button>

            <button type="button" onClick={handleAllClear}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-sky-200 bg-white text-sky-700 hover:bg-sky-50 transition-all cursor-pointer shadow-sm">
              <Radio size={13} />
              Scan All-Clear
            </button>

            {/* Emergency speed cut — most prominent */}
            <button type="button" onClick={handleSpeedCut} disabled={speedCutActive}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-md ml-auto
                ${speedCutActive
                  ? "bg-red-600 border-red-700 text-white animate-pulse shadow-red-300"
                  : "bg-red-500 border-red-600 text-white hover:bg-red-600 shadow-red-200"}`}>
              <Zap size={13} />
              {speedCutActive ? "⚡ THRUSTERS REVERSING…" : "Auto-Engage Reverse Thrusters / Speed Cut"}
            </button>
          </div>
        </div>

        {/* ── Main 2-col grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── LEFT: Arctic Radar Canvas ─────────────────────────────────── */}
          <div className="xl:col-span-2 bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-cyan-50/80 border-b border-cyan-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-cyan-600" />
                <span className="text-xs font-bold text-cyan-900">Arctic Radar Canvas</span>
                <span className="text-[10px] font-mono text-cyan-500 ml-1">— Auto-Course Diverter Active</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="inline-block w-4 border-t-2 border-dashed border-emerald-500" /> Safe Route
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-400 opacity-70" /> Ice Hazard
                </span>
              </div>
            </div>

            <div className="relative p-2 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" style={{ minHeight: 430 }}>

              {/* Ocean / fog overlay */}
              {fogScan && (
                <div className="absolute inset-0 z-10 pointer-events-none rounded-b-2xl"
                  style={{
                    background: `rgba(186,230,253,${Math.max(0, (100 - visibility) / 200)})`,
                    backdropFilter: `blur(${Math.max(0, (100 - visibility) / 40)}px)`,
                  }} />
              )}

              <svg viewBox="0 0 900 420" className="w-full" style={{ display: "block" }}>
                {/* Ocean grid */}
                <defs>
                  <pattern id="ocean-grid" width="45" height="45" patternUnits="userSpaceOnUse">
                    <path d="M 45 0 L 0 0 0 45" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="0.5" />
                  </pattern>
                  <filter id="glow-cyan">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <rect width="900" height="420" fill="url(#ocean-grid)" />

                {/* Range rings from vessel start */}
                {[60, 130, 200, 270, 340].map((r, i) => (
                  <ellipse key={r} cx={VESSEL_START.x} cy={VESSEL_START.y}
                    rx={r * 2.2} ry={r}
                    fill="none" stroke="rgba(56,189,248,0.10)" strokeWidth="0.8"
                    strokeDasharray={i % 2 === 0 ? "none" : "4 6"} />
                ))}

                {/* Sonar sweep */}
                <SonarSweep cx={VESSEL_START.x} cy={VESSEL_START.y} active={sonarActive} />

                {/* Direct route (grey dashed) */}
                <line x1={VESSEL_START.x} y1={VESSEL_START.y}
                  x2={VESSEL_END.x} y2={VESSEL_END.y}
                  stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" strokeDasharray="8 5" />

                {/* Safe course diverter (green dashed) */}
                {showDiverter && (
                  <path d={safePathD}
                    fill="none" stroke="#22c55e" strokeWidth="2.5"
                    strokeDasharray="10 5" strokeLinecap="round"
                    filter="url(#glow-cyan)" opacity="0.85" />
                )}

                {/* Iceberg hazard markers */}
                {ICEBERGS.map((ice) => {
                  const cfg = RISK_CONFIG[ice.risk];
                  const isSelected = selectedIce?.id === ice.id;
                  return (
                    <g key={ice.id} onClick={() => handleSelectIce(ice)}
                      style={{ cursor: "pointer" }}>
                      {/* Pulse rings for CRITICAL */}
                      {ice.risk === "CRITICAL" && sonarActive && (
                        <PulseRing cx={ice.x} cy={ice.y} r={ice.size} color={cfg.stroke} />
                      )}
                      {/* Ice mass blob */}
                      <circle cx={ice.x} cy={ice.y} r={ice.size}
                        fill={cfg.fill} stroke={cfg.stroke}
                        strokeWidth={isSelected ? 3 : 2} opacity="0.88"
                        style={{ animation: "icebergFloat 3s ease-in-out infinite" }} />
                      {/* Sub-surface ice (dashed larger circle) */}
                      <circle cx={ice.x} cy={ice.y} r={ice.size * 1.6}
                        fill="none" stroke={cfg.stroke} strokeWidth="1"
                        strokeDasharray="4 3" opacity="0.4" />
                      {/* Snowflake emoji */}
                      <text x={ice.x} y={ice.y + 5} textAnchor="middle" fontSize="13"
                        style={{ userSelect: "none" }}>❄️</text>
                      {/* Distance badge */}
                      <foreignObject x={ice.x - 36} y={ice.y - ice.size - 28} width="72" height="22">
                        <div className={`text-center text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                          {ice.dist} NM
                        </div>
                      </foreignObject>
                      {/* Label on selection */}
                      {isSelected && (
                        <foreignObject x={ice.x + ice.size + 5} y={ice.y - 22} width="130" height="46">
                          <div className="bg-white border border-sky-200 text-slate-800 text-[9px] rounded-xl px-2 py-1.5 shadow-lg font-mono leading-tight pointer-events-none">
                            <div className="font-black text-slate-900">{ice.id}</div>
                            <div className="text-slate-500">{ice.label}</div>
                            <div className="text-cyan-700 font-bold">Sub-depth: {ice.subDepth}m</div>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}

                {/* Destination marker */}
                <circle cx={VESSEL_END.x} cy={VESSEL_END.y} r="10"
                  fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="2" />
                <text x={VESSEL_END.x} y={VESSEL_END.y + 5} textAnchor="middle"
                  fontSize="11" style={{ userSelect: "none" }}>⚓</text>
                <foreignObject x={VESSEL_END.x - 35} y={VESSEL_END.y + 14} width="70" height="18">
                  <div className="text-[8px] font-bold font-mono text-emerald-600 text-center">DESTINATION</div>
                </foreignObject>

                {/* Animated vessel */}
                <g transform={`translate(${vPos.x},${vPos.y})`}>
                  {sonarActive && (
                    <circle cx={0} cy={0} r={16} fill="none"
                      stroke="#06b6d4" strokeWidth="1.5" opacity="0.5"
                      style={{ animation: "iceRingPulse 1.4s ease-out infinite" }} />
                  )}
                  <circle cx={0} cy={0} r={8} fill="#0284c7" stroke="#fff" strokeWidth="2" />
                  <text x={0} y={4} textAnchor="middle" fontSize="9"
                    style={{ userSelect: "none", fill: "#fff", fontWeight: "bold" }}>▲</text>
                </g>

                {/* Vessel origin marker */}
                <circle cx={VESSEL_START.x} cy={VESSEL_START.y} r="5"
                  fill="rgba(2,132,199,0.2)" stroke="#0284c7" strokeWidth="1.5" />
              </svg>

              {/* Speed cut overlay */}
              {speedCutActive && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-b-2xl pointer-events-none"
                  style={{ background: "rgba(239,68,68,0.12)", animation: "iceRingPulse 0.6s ease-out infinite" }}>
                  <div className="bg-red-600 text-white font-black text-sm px-8 py-4 rounded-2xl border-2 border-red-300 shadow-2xl shadow-red-500/40">
                    ⚡ EMERGENCY — REVERSE THRUSTERS ONLINE — SPEED: 4 KTS
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Panels column ──────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Fog Density Gauge */}
            <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <EyeOff size={14} className="text-violet-500" />
                <span className="text-xs font-bold text-slate-800">Fog Density Gauge</span>
                <span className={`ml-auto text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border
                  ${visibility < 20 ? "bg-red-100 text-red-800 border-red-300"
                  : visibility < 40 ? "bg-amber-100 text-amber-800 border-amber-300"
                  : visibility < 60 ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                  : "bg-emerald-100 text-emerald-700 border-emerald-300"}`}>
                  {visLabel}
                </span>
              </div>
              {/* Arc gauge */}
              <div className="relative flex items-center justify-center py-2">
                <svg viewBox="0 0 120 70" className="w-full max-w-[180px]">
                  <path d="M10,65 A55,55 0 0,1 110,65" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                  <path d="M10,65 A55,55 0 0,1 110,65" fill="none"
                    stroke={visColor} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(visibility / 100) * 173} 173`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }} />
                  <text x="60" y="58" textAnchor="middle" fontSize="17" fontWeight="900"
                    fontFamily="monospace" fill={visColor}>{visibility.toFixed(0)}%</text>
                  <text x="60" y="68" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#94a3b8">VISIBILITY</text>
                </svg>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                <span>0% Blackout</span>
                <span>100% Clear</span>
              </div>
              {!fogScan && (
                <p className="text-[10px] font-mono text-slate-400 text-center mt-2">
                  Enable fog scan for live updates
                </p>
              )}
            </div>

            {/* Sub-surface ice depth sonar */}
            <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-cyan-600" />
                <span className="text-xs font-bold text-slate-800">Sub-Surface Ice Depth Sonar</span>
              </div>
              <div className="space-y-2">
                {ICEBERGS.map((ice) => (
                  <SonarDepthBar key={ice.id} ice={ice} active={sonarActive} />
                ))}
              </div>
              <p className="text-[9px] font-mono text-slate-400 mt-2.5">
                {sonarActive
                  ? "Acoustic sonar · 200kHz · ±3m depth accuracy"
                  : "Activate thermal sonar to display depth readings"}
              </p>
            </div>

            {/* Thermal camera */}
            <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <ThermometerSnowflake size={14} className="text-orange-500" />
                <span className="text-xs font-bold text-slate-800">Thermal Camera Feed</span>
                <span className={`ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full border
                  ${sonarActive ? "bg-orange-50 text-orange-700 border-orange-300" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                  {sonarActive ? "LIVE" : "OFFLINE"}
                </span>
              </div>
              <ThermalCamera icebergs={ICEBERGS} active={sonarActive} />
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "rgba(220,240,255,0.9)" }} /> Ice (cold)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm inline-block bg-amber-400" /> Vessel (warm)
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Bottom row: Hazard table + Scan log ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Iceberg hazard registry */}
          <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-cyan-50/80 border-b border-cyan-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-red-500" />
                <span className="text-xs font-bold text-slate-800">Iceberg Hazard Registry</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {ICEBERGS.length} contacts · {ICEBERGS.filter(i => i.risk === "CRITICAL").length} critical
              </span>
            </div>
            <div className="divide-y divide-sky-50">
              {ICEBERGS.map((ice) => {
                const cfg = RISK_CONFIG[ice.risk];
                const isSelected = selectedIce?.id === ice.id;
                return (
                  <button key={ice.id} type="button" onClick={() => handleSelectIce(ice)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left border-l-4 transition-all cursor-pointer
                      ${isSelected ? "bg-sky-50 border-sky-400" : "bg-white hover:bg-sky-50/50 border-transparent"}`}>
                    <span className="text-lg"
                      style={{ animation: ice.risk === "CRITICAL" ? "icebergFloat 2s ease-in-out infinite" : "none" }}>
                      {ice.risk === "CRITICAL" ? "🧊" : "❄️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold font-mono text-slate-900">{ice.id}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                          {ice.risk}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 truncate block">{ice.label}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-black font-mono text-slate-800">{ice.dist} NM</div>
                      <div className="text-[9px] font-mono text-slate-400">Sub: {ice.subDepth}m</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scan activity log */}
          <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-cyan-50/80 border-b border-cyan-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-sky-600" />
                <span className="text-xs font-bold text-slate-800">Sonar Activity Log</span>
              </div>
              <button type="button" onClick={() => setScanLog([])}
                className="p-1 rounded-lg hover:bg-sky-100 transition-all cursor-pointer">
                <RotateCcw size={11} className="text-slate-400" />
              </button>
            </div>
            <div className="bg-slate-900 rounded-b-2xl min-h-[220px] p-4 font-mono text-[10px] space-y-1.5 overflow-y-auto max-h-[280px]">
              {scanLog.length === 0 ? (
                <p className="text-slate-500 text-center mt-8">
                  — Awaiting sonar activation —
                </p>
              ) : (
                scanLog.map((entry, i) => (
                  <div key={i} className={`leading-relaxed ${
                    entry.includes("EMERGENCY") || entry.includes("CRITICAL") ? "text-red-400"
                    : entry.includes("ACTIVATED") || entry.includes("detected") ? "text-amber-300"
                    : entry.includes("clear") || entry.includes("Safe") ? "text-emerald-400"
                    : "text-slate-300"
                  }`}>
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
