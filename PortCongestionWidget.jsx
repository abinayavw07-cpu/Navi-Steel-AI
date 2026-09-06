/**
 * PortCongestionWidget — East-Coast India Port Congestion & Anchorage Wait Predictor
 * Sky Blue Light Theme · White cards · sky-200 borders
 *
 * Shows: Active queue count, avg wait time, berth availability,
 *        tide window, and a simulated live-updating wait bar for 6 ports.
 */
import { useState, useEffect } from "react";
import {
  Anchor, Clock, AlertTriangle, RefreshCw, TrendingUp,
  TrendingDown, Minus, Activity, Ship, BarChart2,
} from "lucide-react";

// ─── Port baseline data ───────────────────────────────────────────────────────
const PORT_BASE = [
  {
    id: "VZG", name: "Visakhapatnam", shortName: "Vizag",
    state: "Andhra Pradesh", type: "Major",
    queue: 4, waitHrs: 3.5, berthFree: 2, tideClearHrs: 1.5,
    draftLimit: 14.5, status: "MODERATE",
    cargo: "Iron Ore / Coal",
  },
  {
    id: "CHN", name: "Chennai", shortName: "Chennai",
    state: "Tamil Nadu", type: "Major",
    queue: 7, waitHrs: 6.2, berthFree: 0, tideClearHrs: 2.0,
    draftLimit: 12.8, status: "HIGH",
    cargo: "Containers / Ro-Ro",
  },
  {
    id: "HLD", name: "Haldia", shortName: "Haldia",
    state: "West Bengal", type: "Major",
    queue: 11, waitHrs: 9.8, berthFree: 0, tideClearHrs: 4.5,
    draftLimit: 8.5, status: "CRITICAL",
    cargo: "Coal / Fertilizer",
  },
  {
    id: "TUT", name: "Tuticorin (VOC)", shortName: "Tuticorin",
    state: "Tamil Nadu", type: "Minor",
    queue: 2, waitHrs: 1.8, berthFree: 3, tideClearHrs: 0.5,
    draftLimit: 10.5, status: "LOW",
    cargo: "Thermal Coal / Clinker",
  },
  {
    id: "PDG", name: "Paradip", shortName: "Paradip",
    state: "Odisha", type: "Major",
    queue: 6, waitHrs: 5.1, berthFree: 1, tideClearHrs: 2.5,
    draftLimit: 14.0, status: "HIGH",
    cargo: "Iron Ore / POL",
  },
  {
    id: "KOL", name: "Kolkata / KoPT", shortName: "Kolkata",
    state: "West Bengal", type: "Major",
    queue: 3, waitHrs: 2.4, berthFree: 2, tideClearHrs: 3.0,
    draftLimit: 7.2, status: "MODERATE",
    cargo: "General Cargo / Steel",
  },
];

const STATUS_CFG = {
  LOW:      { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-800 border-emerald-300", dot: "bg-emerald-500", icon: TrendingDown },
  MODERATE: { bar: "bg-sky-500",     badge: "bg-sky-50 text-sky-800 border-sky-300",             dot: "bg-sky-500",     icon: Minus        },
  HIGH:     { bar: "bg-amber-500",   badge: "bg-amber-50 text-amber-800 border-amber-300",       dot: "bg-amber-500",   icon: TrendingUp   },
  CRITICAL: { bar: "bg-red-500",     badge: "bg-red-50 text-red-800 border-red-300",             dot: "bg-red-500",     icon: AlertTriangle },
};

// Max wait hours for bar scaling
const MAX_WAIT = 12;

export default function PortCongestionWidget({ curSymbol = "$", exchangeRate = 1 }) {
  const [ports, setPorts]       = useState(PORT_BASE);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Live simulation — drift queue and wait values every 6 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setPorts((prev) => prev.map((p) => {
        const dq = Math.round((Math.random() - 0.48) * 2);
        const dw = parseFloat(((Math.random() - 0.48) * 0.6).toFixed(1));
        const newQueue = Math.max(0, p.queue + dq);
        const newWait  = parseFloat(Math.max(0.2, p.waitHrs + dw).toFixed(1));
        // Re-derive status
        const status =
          newWait < 2.5 ? "LOW" :
          newWait < 5.0 ? "MODERATE" :
          newWait < 8.0 ? "HIGH" : "CRITICAL";
        return { ...p, queue: newQueue, waitHrs: newWait, status };
      }));
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setPorts(PORT_BASE.map((p) => ({
        ...p,
        queue:   Math.max(0, p.queue + Math.round((Math.random() - 0.5) * 3)),
        waitHrs: parseFloat(Math.max(0.3, p.waitHrs + (Math.random() - 0.5)).toFixed(1)),
      })));
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 800);
  };

  const totalQueued = ports.reduce((s, p) => s + p.queue, 0);
  const avgWait     = (ports.reduce((s, p) => s + p.waitHrs, 0) / ports.length).toFixed(1);
  const criticalCt  = ports.filter((p) => p.status === "CRITICAL").length;

  return (
    <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="bg-sky-50/70 border-b border-sky-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 border border-sky-200 rounded-xl">
            <Anchor size={16} className="text-sky-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Port Congestion & Anchorage Wait Predictor
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              East Coast India · 6 major ports · Live queue intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">
            {lastUpdated.toLocaleTimeString("en-GB", { hour12: false })}
          </span>
          <button type="button" onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-white
              text-xs font-bold text-sky-700 hover:bg-sky-50 cursor-pointer transition-all disabled:opacity-50">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Updating…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-3 divide-x divide-sky-100 border-b border-sky-100">
        {[
          { label: "Total Ships Queued", value: totalQueued, unit: "vessels", icon: Ship,         color: "text-sky-600"   },
          { label: "Avg Wait Time",      value: `${avgWait}`, unit: "hrs",    icon: Clock,        color: "text-amber-600" },
          { label: "Critical Ports",     value: criticalCt,  unit: "ports",   icon: AlertTriangle, color: "text-red-500"   },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="px-5 py-3 flex items-center gap-3">
            <Icon size={18} className={`${color} shrink-0`} />
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-slate-900">{value}</span>
                <span className="text-[10px] font-mono text-slate-400">{unit}</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Port rows */}
      <div className="divide-y divide-sky-50">
        {ports.map((port) => {
          const cfg  = STATUS_CFG[port.status];
          const barW = Math.min((port.waitHrs / MAX_WAIT) * 100, 100);
          const isSel = selected === port.id;
          return (
            <div key={port.id}>
              <button type="button"
                onClick={() => setSelected(isSel ? null : port.id)}
                className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-all cursor-pointer
                  border-l-4 hover:bg-sky-50/60
                  ${isSel ? "bg-sky-50 border-sky-400" : "bg-white border-transparent"}`}>

                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}
                  ${port.status === "CRITICAL" ? "animate-pulse" : ""}`} />

                {/* Port name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{port.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                      {port.status}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">{port.state}</span>
                  </div>
                  {/* Wait bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-sky-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                        style={{ width: `${barW}%` }} />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">
                      {port.cargo}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-xs font-black font-mono text-slate-900">
                      {port.queue} <span className="text-[9px] font-mono text-slate-400">ships</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">queue</div>
                  </div>
                  <div>
                    <div className="text-xs font-black font-mono text-amber-700">
                      {port.waitHrs} <span className="text-[9px] font-mono text-slate-400">hrs</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">est. wait</div>
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-xs font-black font-mono
                      ${port.berthFree > 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {port.berthFree > 0 ? port.berthFree : "FULL"}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">berths free</div>
                  </div>
                </div>
              </button>

              {/* Expanded detail panel */}
              {isSel && (
                <div className="bg-sky-50/60 border-t border-sky-100 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Draft Limit",    value: `${port.draftLimit}m`,     color: "text-sky-700"    },
                    { label: "Tide Window",    value: `${port.tideClearHrs}h`,   color: "text-violet-700" },
                    { label: "Berths Free",    value: port.berthFree > 0 ? `${port.berthFree} open` : "Full — Anchor", color: port.berthFree > 0 ? "text-emerald-700" : "text-red-600" },
                    { label: "Primary Cargo",  value: port.cargo,                color: "text-amber-700"  },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-sky-100 px-3 py-2">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
                      <div className={`text-xs font-black font-mono ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-sky-50/50 border-t border-sky-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <Activity size={10} className="text-emerald-500 animate-pulse" />
          Live queue updates every 6s · Simulated port intelligence feed
        </span>
        <span>Click any port row to expand details</span>
      </div>
    </div>
  );
}
