/**
 * BunkerFuelIndex — Port Fuel Price Index & Bunker Optimizer
 * Sky Blue Light Theme · White card · sky-200 borders
 *
 * Shows: VLSFO & MGO live rates across 8 regional bunkering hubs,
 *        best-value badge, savings calculator, and trend sparklines.
 */
import { useState, useEffect } from "react";
import {
  Fuel, TrendingUp, TrendingDown, Minus,
  Star, RefreshCw, BarChart2, Activity, Zap,
} from "lucide-react";

// ─── Bunker hub baseline prices (USD/MT) ─────────────────────────────────────
const BUNKER_BASE = [
  { id: "FUJ", hub: "Fujairah",       region: "UAE / Gulf",       vlsfo: 578, mgo: 820,  lsmgo: 695, availability: "HIGH"   },
  { id: "SGP", hub: "Singapore",      region: "Straits / SE Asia", vlsfo: 590, mgo: 835,  lsmgo: 712, availability: "HIGH"   },
  { id: "COL", hub: "Colombo",        region: "Sri Lanka",        vlsfo: 602, mgo: 852,  lsmgo: 728, availability: "MED"    },
  { id: "PKG", hub: "Port Klang",     region: "Malaysia",         vlsfo: 585, mgo: 831,  lsmgo: 704, availability: "HIGH"   },
  { id: "VZG", hub: "Visakhapatnam",  region: "East Coast India", vlsfo: 621, mgo: 893,  lsmgo: 748, availability: "LOW"    },
  { id: "CHN", hub: "Chennai",        region: "East Coast India", vlsfo: 614, mgo: 880,  lsmgo: 740, availability: "MED"    },
  { id: "MBY", hub: "Mumbai / JNPT",  region: "West Coast India", vlsfo: 608, mgo: 868,  lsmgo: 735, availability: "MED"    },
  { id: "HKG", hub: "Hong Kong",      region: "East Asia",        vlsfo: 598, mgo: 848,  lsmgo: 720, availability: "HIGH"   },
];

const AVAIL_CFG = {
  HIGH: { cls: "bg-emerald-50 text-emerald-800 border-emerald-300", label: "High"   },
  MED:  { cls: "bg-amber-50  text-amber-800   border-amber-300",   label: "Medium" },
  LOW:  { cls: "bg-red-50    text-red-800     border-red-300",     label: "Low"    },
};

// ─── Tiny sparkline from 5 data points ───────────────────────────────────────
function Sparkline({ data, color }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const W = 52, H = 20;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-[52px] h-5 shrink-0">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]}
        r="2" fill={color} />
    </svg>
  );
}

// ─── Generate deterministic mock 5-day trend ─────────────────────────────────
function genTrend(base, seed) {
  return Array.from({ length: 5 }, (_, i) => {
    const noise = Math.sin(seed * 7 + i * 1.3) * 12;
    return Math.round(base + noise);
  });
}

export default function BunkerFuelIndex({ curSymbol = "$", exchangeRate = 1 }) {
  const [hubs, setHubs]             = useState(BUNKER_BASE);
  const [fuelType, setFuelType]     = useState("vlsfo"); // vlsfo | mgo | lsmgo
  const [sortBy, setSortBy]         = useState("price");  // price | availability | hub
  const [refreshing, setRefreshing] = useState(false);
  const [qty, setQty]               = useState(500);     // MT for savings calc

  const cvt = (usd) => parseFloat((usd * exchangeRate).toFixed(0));
  const fmt = (usd) => `${curSymbol}${cvt(usd).toLocaleString()}`;

  // Live price drift every 8 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setHubs((prev) => prev.map((h) => ({
        ...h,
        vlsfo: Math.round(Math.max(500, h.vlsfo + (Math.random() - 0.5) * 8)),
        mgo:   Math.round(Math.max(680, h.mgo   + (Math.random() - 0.5) * 10)),
        lsmgo: Math.round(Math.max(600, h.lsmgo + (Math.random() - 0.5) * 9)),
      })));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setHubs([...BUNKER_BASE]); setRefreshing(false); }, 700);
  };

  // Determine best-value port for selected fuel type
  const prices    = hubs.map((h) => h[fuelType]);
  const minPrice  = Math.min(...prices);
  const maxPrice  = Math.max(...prices);
  const bestId    = hubs.find((h) => h[fuelType] === minPrice)?.id;
  const savings   = maxPrice - minPrice; // worst vs best savings/MT

  // Sort
  const sorted = [...hubs].sort((a, b) => {
    if (sortBy === "price") return a[fuelType] - b[fuelType];
    if (sortBy === "hub")   return a.hub.localeCompare(b.hub);
    // availability: HIGH > MED > LOW
    const order = { HIGH: 0, MED: 1, LOW: 2 };
    return order[a.availability] - order[b.availability];
  });

  const FUEL_TABS = [
    { key: "vlsfo", label: "VLSFO",  sub: "Very Low Sulphur FO" },
    { key: "mgo",   label: "MGO",    sub: "Marine Gas Oil"       },
    { key: "lsmgo", label: "LSMGO",  sub: "Low Sulphur MGO"      },
  ];

  return (
    <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="bg-sky-50/70 border-b border-sky-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-100 border border-violet-200 rounded-xl">
            <Fuel size={16} className="text-violet-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Port Fuel Price Index & Bunker Optimizer
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              8 bunkering hubs · Live USD/MT rates · Best value routing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600">
            <Activity size={9} className="animate-pulse" /> Live
          </span>
          <button type="button" onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-white
              text-xs font-bold text-sky-700 hover:bg-sky-50 cursor-pointer transition-all disabled:opacity-50">
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-sky-100 bg-white">
        {/* Fuel type tabs */}
        <div className="flex gap-1 p-1 bg-sky-50 border border-sky-200 rounded-xl">
          {FUEL_TABS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setFuelType(key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer
                ${fuelType === key
                  ? "bg-violet-500 text-white shadow-sm shadow-violet-200"
                  : "text-slate-500 hover:text-violet-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Sort control */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">Sort:</span>
          {[["price","Price"],["availability","Avail"],["hub","Hub"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setSortBy(k)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all
                ${sortBy === k
                  ? "bg-sky-500 text-white border-sky-500"
                  : "bg-white text-slate-500 border-sky-200 hover:border-sky-400"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Savings calculator qty */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-slate-400">Qty:</span>
          <input type="number" value={qty} min={50} max={5000} step={50}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-20 border border-sky-200 rounded-lg px-2 py-1 text-[11px] font-bold font-mono
              text-slate-800 bg-sky-50/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
          <span className="text-slate-400">MT</span>
        </div>
      </div>

      {/* Best value savings banner */}
      <div className="mx-5 mt-3 mb-1 bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200
        rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star size={13} className="text-emerald-600 shrink-0" />
          <span className="text-[11px] font-bold text-emerald-800">
            Best Value: <span className="font-black">{hubs.find((h) => h.id === bestId)?.hub}</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-600">
            @ {fmt(minPrice)}/MT
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-violet-600 shrink-0" />
          <span className="text-[11px] font-mono text-violet-700">
            Potential saving vs worst port:&nbsp;
            <span className="font-black">{fmt(savings * qty)}</span>
            &nbsp;for {qty.toLocaleString()} MT
          </span>
        </div>
      </div>

      {/* Price table */}
      <div className="px-5 pb-1 mt-3">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-1.5 text-[9px] font-black font-mono uppercase tracking-wider text-slate-400 border-b border-sky-100">
          <span>Hub / Region</span>
          <span className="text-right w-20">Price/MT</span>
          <span className="text-right w-20 hidden sm:block">vs Best</span>
          <span className="text-center w-14 hidden sm:block">Avail</span>
          <span className="text-right w-14">5-Day</span>
        </div>

        <div className="divide-y divide-sky-50">
          {sorted.map((hub, idx) => {
            const price     = hub[fuelType];
            const isBest    = hub.id === bestId;
            const diff      = price - minPrice;
            const avail     = AVAIL_CFG[hub.availability];
            const trend5    = genTrend(price, hub.id.charCodeAt(0));
            const trendDir  = trend5[4] > trend5[0] ? "up" : trend5[4] < trend5[0] ? "down" : "flat";
            const trendColor = trendDir === "up" ? "#f97316" : trendDir === "down" ? "#22c55e" : "#94a3b8";

            return (
              <div key={hub.id}
                className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 items-center px-3 py-2.5 rounded-xl transition-all
                  ${isBest ? "bg-emerald-50/70 border border-emerald-100 my-0.5" : "hover:bg-sky-50/40"}`}>

                {/* Hub name + rank */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-black font-mono text-slate-400 w-4 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">{hub.hub}</span>
                      {isBest && (
                        <span className="flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Star size={8} /> BEST
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">{hub.region}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right w-20">
                  <div className={`text-sm font-black font-mono ${isBest ? "text-emerald-700" : "text-slate-900"}`}>
                    {fmt(price)}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">/MT</div>
                </div>

                {/* Diff vs best */}
                <div className="text-right w-20 hidden sm:block">
                  {diff === 0 ? (
                    <span className="text-[10px] font-bold font-mono text-emerald-600">—</span>
                  ) : (
                    <span className="text-[10px] font-bold font-mono text-red-500">
                      +{fmt(diff)}
                    </span>
                  )}
                </div>

                {/* Availability */}
                <div className="text-center w-14 hidden sm:block">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${avail.cls}`}>
                    {avail.label}
                  </span>
                </div>

                {/* 5-day sparkline + trend arrow */}
                <div className="flex items-center gap-1 w-14 justify-end">
                  <Sparkline data={trend5} color={trendColor} />
                  {trendDir === "up"   && <TrendingUp   size={11} style={{ color: trendColor }} />}
                  {trendDir === "down" && <TrendingDown size={11} style={{ color: trendColor }} />}
                  {trendDir === "flat" && <Minus        size={11} style={{ color: trendColor }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 mt-2 border-t border-sky-100 bg-sky-50/50 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <span>
          {FUEL_TABS.find((f) => f.key === fuelType)?.sub} · Prices in {curSymbol}/MT ·
          Updated every 8s
        </span>
        <span className="flex items-center gap-1.5">
          <BarChart2 size={10} className="text-violet-500" />
          5-day sparkline shows price momentum
        </span>
      </div>
    </div>
  );
}
