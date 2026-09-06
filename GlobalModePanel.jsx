/**
 * GlobalModePanel — Secondary Global Maritime Extension Suite
 * Sky Blue Light Theme · White cards · sky-200 borders
 *
 * Three modules (rendered when GLOBAL mode is active):
 *  1. Arctic Iceberg & Fog Thermal Radar — layer control card (links to GeoNav toggle)
 *  2. Worldwide Bunkering Fuel Price Index (Singapore / Rotterdam / Fujairah / HK)
 *  3. Global IMO 2026 CII / EEXI Carbon Rating Predictor
 */
import { useState, useEffect } from "react";
import {
  Snowflake, Globe, Fuel, BarChart2, TrendingUp, TrendingDown,
  Minus, Star, Activity, Layers, CheckCircle2, AlertTriangle,
  RefreshCw, Zap, Leaf,
} from "lucide-react";

// ─── 2. Global bunker hubs ────────────────────────────────────────────────────
const GLOBAL_BUNKER_BASE = [
  { id: "SGP", hub: "Singapore",    region: "SE Asia",        vlsfo: 590, mgo: 835, trend: "up"   },
  { id: "RTM", hub: "Rotterdam",    region: "NW Europe",      vlsfo: 612, mgo: 861, trend: "up"   },
  { id: "FUJ", hub: "Fujairah",     region: "UAE / Gulf",     vlsfo: 578, mgo: 820, trend: "flat" },
  { id: "HKG", hub: "Hong Kong",    region: "East Asia",      vlsfo: 598, mgo: 848, trend: "down" },
  { id: "PAN", hub: "Panama",       region: "Central America",vlsfo: 621, mgo: 872, trend: "up"   },
  { id: "AMS", hub: "Houston",      region: "US Gulf",        vlsfo: 605, mgo: 855, trend: "down" },
];

// ─── 3. CII/EEXI predictor data ───────────────────────────────────────────────
const CII_VESSEL_TYPES = ["Capesize Bulker", "Panamax Bulker", "VLCC Tanker", "Container Ship", "LNG Carrier"];

const CII_RATINGS = ["A", "B", "C", "D", "E"];
const CII_RATING_STYLE = {
  A: { bg: "bg-emerald-500", text: "text-white",  badge: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  B: { bg: "bg-green-500",   text: "text-white",  badge: "bg-green-50 text-green-800 border-green-300"     },
  C: { bg: "bg-amber-400",   text: "text-white",  badge: "bg-amber-50 text-amber-800 border-amber-300"     },
  D: { bg: "bg-orange-500",  text: "text-white",  badge: "bg-orange-50 text-orange-800 border-orange-300"  },
  E: { bg: "bg-red-500",     text: "text-white",  badge: "bg-red-50 text-red-800 border-red-300"           },
};

// Deterministic CII score based on inputs
function calcCIIRating(distNm, fuelMt, dwt) {
  if (!distNm || !fuelMt || !dwt) return { rating: "C", score: 0, eexi: 85 };
  const aer    = (fuelMt * 3.114 * 1e6) / (dwt * distNm);
  const score  = parseFloat(aer.toFixed(3));
  const eexi   = Math.round(60 + (fuelMt / (dwt / 1000)) * 2.8);
  const rating =
    score < 3.5  ? "A" :
    score < 5.0  ? "B" :
    score < 7.0  ? "C" :
    score < 9.5  ? "D" : "E";
  return { rating, score, eexi: Math.min(eexi, 115) };
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 48, H = 18;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-12 h-[18px] shrink-0">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]}
        r="2" fill={color} />
    </svg>
  );
}

function genTrend(base, seed) {
  return Array.from({ length: 5 }, (_, i) => Math.round(base + Math.sin(seed * 3 + i * 1.5) * 14));
}

// ─── CII rating bar ───────────────────────────────────────────────────────────
function CIIRatingBar({ rating }) {
  const order = CII_RATINGS.indexOf(rating);
  return (
    <div className="flex items-center gap-1">
      {CII_RATINGS.map((r, i) => (
        <div key={r}
          className={`h-5 flex items-center justify-center text-[9px] font-black rounded transition-all
            ${i === order ? `${CII_RATING_STYLE[r].bg} ${CII_RATING_STYLE[r].text} w-7 scale-110` : "bg-slate-100 text-slate-400 w-5"}`}>
          {r}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GlobalModePanel({ curSymbol = "$", exchangeRate = 1 }) {
  const [bunkerHubs, setBunkerHubs] = useState(GLOBAL_BUNKER_BASE);
  const [fuelType,   setFuelType]   = useState("vlsfo");
  const [vesselType, setVesselType] = useState("Capesize Bulker");
  const [distNm,     setDistNm]     = useState(8400);
  const [fuelMt,     setFuelMt]     = useState(1820);
  const [dwtK,       setDwtK]       = useState(180);   // DWT in 1000s
  const [ciiResult,  setCiiResult]  = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const cvt = (usd) => `${curSymbol}${Math.round(usd * exchangeRate).toLocaleString()}`;

  // Live bunker price drift
  useEffect(() => {
    const id = setInterval(() => {
      setBunkerHubs((prev) => prev.map((h) => ({
        ...h,
        vlsfo: Math.round(Math.max(500, h.vlsfo + (Math.random() - 0.5) * 9)),
        mgo:   Math.round(Math.max(680, h.mgo   + (Math.random() - 0.5) * 11)),
      })));
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const minPrice  = Math.min(...bunkerHubs.map((h) => h[fuelType]));
  const bestId    = bunkerHubs.find((h) => h[fuelType] === minPrice)?.id;

  const handleCalcCII = () => {
    setCalcLoading(true);
    setTimeout(() => {
      setCiiResult(calcCIIRating(distNm, fuelMt, dwtK * 1000));
      setCalcLoading(false);
    }, 700);
  };

  return (
    <div className="space-y-5">

      {/* ── MODE BANNER ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl px-5 py-3.5
        flex flex-wrap items-center gap-3 shadow-md">
        <Globe size={18} className="text-slate-300 shrink-0" />
        <div>
          <p className="text-white font-black text-sm tracking-tight">
            Global Maritime Operations — Extension Mode Active
          </p>
          <p className="text-slate-400 text-[11px] font-mono">
            Arctic Safety · International Bunkering · IMO 2026 Carbon Compliance · 20% Focus
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
            <Activity size={9} className="animate-pulse text-blue-400" />
            GLOBAL FEED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── MODULE 1: ARCTIC ICEBERG LAYER CONTROL ────────────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-xl">
              <Snowflake size={16} className="text-cyan-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Arctic Iceberg & Fog Radar</h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Thermal sonar · Ice contact tracking · Fog density
              </p>
            </div>
          </div>

          {/* Layer status chips */}
          <div className="space-y-2 mb-4">
            {[
              { label: "Ice Contact ICE-01",  dist: "2.1 NM", risk: "CRITICAL", emoji: "🧊" },
              { label: "Ice Contact ICE-02",  dist: "4.7 NM", risk: "HIGH",     emoji: "❄️" },
              { label: "Ice Contact ICE-03",  dist: "6.3 NM", risk: "MEDIUM",   emoji: "❄️" },
              { label: "Gulf Coastal Growler",dist: "9.1 NM", risk: "LOW",      emoji: "❄️" },
            ].map((c) => (
              <div key={c.label}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-cyan-100 bg-cyan-50/30">
                <span className="text-base">{c.emoji}</span>
                <div className="flex-1 min-w-0 text-[10px] font-mono">
                  <span className="font-bold text-slate-800">{c.label}</span>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                  c.risk === "CRITICAL" ? "bg-red-100 text-red-800 border-red-300" :
                  c.risk === "HIGH"     ? "bg-amber-100 text-amber-800 border-amber-300" :
                  c.risk === "MEDIUM"   ? "bg-cyan-100 text-cyan-800 border-cyan-300" :
                                          "bg-sky-100 text-sky-800 border-sky-200"
                }`}>
                  {c.dist}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Layers size={11} className="text-cyan-600" />
              <span className="text-[10px] font-bold font-mono text-cyan-800">
                Toggle in GeoNav Tab → Overlays → Iceberg & Fog
              </span>
            </div>
            <p className="text-[9px] font-mono text-cyan-600">
              Ice divert path · Fog density gauge · Thermal camera feed · IR radius rings all active in GeoNav canvas.
            </p>
          </div>
        </div>

        {/* ── MODULE 2: WORLDWIDE BUNKER PRICE INDEX ────────────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-violet-50 border border-violet-200 rounded-xl">
              <Fuel size={16} className="text-violet-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Global Bunker Price Index</h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Singapore · Rotterdam · Fujairah + 3 hubs · Live USD/MT
              </p>
            </div>
          </div>

          {/* Fuel type toggle */}
          <div className="flex gap-1 p-1 bg-sky-50 border border-sky-200 rounded-xl mb-3">
            {["vlsfo", "mgo"].map((k) => (
              <button key={k} type="button" onClick={() => setFuelType(k)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer
                  ${fuelType === k
                    ? "bg-violet-500 text-white"
                    : "text-slate-500 hover:text-violet-700"}`}>
                {k.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {bunkerHubs.map((hub) => {
              const price    = hub[fuelType];
              const isBest   = hub.id === bestId;
              const trend5   = genTrend(price, hub.id.charCodeAt(0));
              const tColor   = hub.trend === "up" ? "#f97316" : hub.trend === "down" ? "#22c55e" : "#94a3b8";
              return (
                <div key={hub.id}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all
                    ${isBest ? "bg-emerald-50 border-emerald-200" : "border-sky-100 hover:bg-sky-50/40"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-900">{hub.hub}</span>
                      {isBest && <Star size={9} className="text-emerald-500" />}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">{hub.region}</span>
                  </div>
                  <span className={`text-xs font-black font-mono ${isBest ? "text-emerald-700" : "text-slate-800"}`}>
                    {cvt(price)}
                  </span>
                  <Sparkline data={trend5} color={tColor} />
                  {hub.trend === "up"   && <TrendingUp   size={11} color={tColor} />}
                  {hub.trend === "down" && <TrendingDown size={11} color={tColor} />}
                  {hub.trend === "flat" && <Minus        size={11} color={tColor} />}
                </div>
              );
            })}
          </div>
          <p className="text-[9px] font-mono text-slate-400 mt-2.5 flex items-center gap-1">
            <Activity size={9} className="text-emerald-500 animate-pulse" />
            Prices drift live every 7s
          </p>
        </div>

        {/* ── MODULE 3: IMO 2026 CII / EEXI PREDICTOR ───────────────────── */}
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <Leaf size={16} className="text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">IMO 2026 CII / EEXI Predictor</h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Carbon Intensity Indicator · Energy Efficiency Rating
              </p>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-2.5 mb-4">
            {/* Vessel type */}
            <div>
              <label className="block text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1">
                Vessel Type
              </label>
              <select value={vesselType} onChange={(e) => setVesselType(e.target.value)}
                className="w-full bg-sky-50 border border-sky-200 rounded-xl text-[11px] font-mono
                  font-bold text-slate-800 py-2 px-3 focus:outline-none focus:ring-2
                  focus:ring-sky-400/40 cursor-pointer">
                {CII_VESSEL_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Distance (NM)", val: distNm, set: setDistNm, min: 100, max: 25000 },
                { label: "Fuel (MT)",     val: fuelMt, set: setFuelMt, min: 50,  max: 10000 },
                { label: "DWT (×1000)",   val: dwtK,   set: setDwtK,  min: 5,   max: 400   },
              ].map(({ label, val, set, min, max }) => (
                <div key={label}>
                  <label className="block text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1">
                    {label}
                  </label>
                  <input type="number" value={val} min={min} max={max}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full bg-sky-50 border border-sky-200 rounded-xl text-[11px]
                      font-mono font-bold text-slate-800 py-2 px-2 focus:outline-none
                      focus:ring-2 focus:ring-sky-400/40" />
                </div>
              ))}
            </div>
          </div>

          {/* Calculate button */}
          <button type="button" onClick={handleCalcCII} disabled={calcLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold
              cursor-pointer transition-all disabled:opacity-50 mb-3">
            {calcLoading
              ? <><RefreshCw size={12} className="animate-spin" /> Calculating…</>
              : <><Zap size={12} /> Calculate CII / EEXI Rating</>
            }
          </button>

          {/* Result */}
          {ciiResult && (
            <div className={`rounded-xl p-3 border ${
              ciiResult.rating === "A" || ciiResult.rating === "B"
                ? "bg-emerald-50 border-emerald-200"
                : ciiResult.rating === "C"
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black font-mono text-slate-600">CII RATING 2026</span>
                <CIIRatingBar rating={ciiResult.rating} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "CII Score", value: ciiResult.score, unit: "g/(DWT·NM)", color: CII_RATING_STYLE[ciiResult.rating].badge },
                  { label: "EEXI",      value: ciiResult.eexi, unit: "g CO₂/t·NM", color: "bg-sky-50 text-sky-800 border-sky-300" },
                  { label: "Vessel",    value: vesselType.split(" ")[0], unit: "", color: "bg-slate-50 text-slate-700 border-slate-200" },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} className={`rounded-xl border px-2 py-1.5 ${color}`}>
                    <div className="text-[9px] font-mono uppercase text-current opacity-70">{label}</div>
                    <div className="text-xs font-black font-mono">{value}</div>
                    {unit && <div className="text-[7px] font-mono opacity-60">{unit}</div>}
                  </div>
                ))}
              </div>
              <p className={`text-[9px] font-mono mt-2 ${
                ciiResult.rating === "D" || ciiResult.rating === "E"
                  ? "text-red-600 font-bold"
                  : "text-slate-500"
              }`}>
                {ciiResult.rating === "D" || ciiResult.rating === "E"
                  ? "⚠ Port authority penalty risk elevated. Reduce speed or optimise fuel load."
                  : ciiResult.rating === "C"
                  ? "IMO Threshold compliant — monitor and review quarterly."
                  : "✓ Exceeds IMO 2026 standard. No port penalty risk."
                }
              </p>
            </div>
          )}

          {!ciiResult && (
            <div className="bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-mono text-slate-500">
                Enter voyage parameters above and run the calculator to predict your IMO 2026 CII rating and EEXI compliance status.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
