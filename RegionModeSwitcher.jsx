/**
 * RegionModeSwitcher — Dual-Mode Header Banner
 * Toggles between EAST_COAST (default) and GLOBAL operation modes.
 * Sky Blue Light Theme.
 */
import { Globe, Anchor, ChevronRight, Activity } from "lucide-react";

const EC_FEATURES = [
  "Fishing Fleet Radar",
  "Bay of Bengal Cyclone Evasion",
  "EC Port Congestion Tracker",
  "River Debris & Smuggling Scan",
];

const GL_FEATURES = [
  "Arctic Iceberg Thermal Radar",
  "Global Bunker Price Index",
  "IMO 2026 CII/EEXI Predictor",
];

export default function RegionModeSwitcher({ regionMode, setRegionMode }) {
  const isEC = regionMode === "EAST_COAST";

  return (
    <div className={`border-b transition-colors duration-300 ${
      isEC
        ? "bg-sky-600 border-sky-700"
        : "bg-slate-800 border-slate-700"
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center gap-3">

        {/* Mode label */}
        <div className="flex items-center gap-2 shrink-0">
          {isEC
            ? <Anchor size={14} className="text-sky-200" />
            : <Globe   size={14} className="text-slate-300" />
          }
          <span className={`text-[11px] font-black font-mono uppercase tracking-widest ${
            isEC ? "text-sky-100" : "text-slate-200"
          }`}>
            {isEC ? "🟢 East Coast India Corridor" : "🌐 Global Maritime Operations"}
          </span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
            isEC
              ? "bg-sky-500/40 border-sky-400 text-sky-100"
              : "bg-slate-600/60 border-slate-500 text-slate-300"
          }`}>
            {isEC ? "PRIMARY · 80%" : "GLOBAL · 20%"}
          </span>
        </div>

        {/* Feature pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(isEC ? EC_FEATURES : GL_FEATURES).map((f) => (
            <span key={f} className={`flex items-center gap-1 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
              isEC
                ? "bg-sky-500/30 border-sky-400/50 text-sky-100"
                : "bg-slate-600/40 border-slate-500/50 text-slate-300"
            }`}>
              <Activity size={7} className={isEC ? "text-sky-300" : "text-slate-400"} />
              {f}
            </span>
          ))}
        </div>

        {/* Toggle button */}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setRegionMode(isEC ? "GLOBAL" : "EAST_COAST")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold border
              cursor-pointer transition-all hover:scale-105 ${
              isEC
                ? "bg-white text-sky-700 border-white/80 hover:bg-sky-50"
                : "bg-sky-500 text-white border-sky-400 hover:bg-sky-600"
            }`}
          >
            {isEC
              ? <><Globe size={12} /> Switch to Global Mode</>
              : <><Anchor size={12} /> Switch to East Coast</>
            }
            <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
