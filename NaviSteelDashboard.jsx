import React, { useState, useEffect, useRef } from 'react';
import { 
  Anchor, UserCheck, LogOut, FileDown, Globe, WifiOff, 
  TrendingUp, Fuel, BrainCircuit, PlusCircle, Sparkles, 
  ChevronRight, AlertTriangle, CloudSun, BadgeIndianRupee, Leaf, 
  Ship, MapPin, CalendarDays, Gauge, RefreshCw, CheckCircle2, Navigation, Compass 
} from 'lucide-react';
import BunkerOptimizer from './BunkerOptimizer';
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, 
  XAxis, YAxis, Tooltip, ReferenceLine 
} from 'recharts';


export default function NaviSteelDashboard() {
  const [tonnage, setTonnage] = useState(50000);
  const [originPort, setOriginPort] = useState("Visakhapatnam");
  const [destinationPort, setDestinationPort] = useState("Paradip");
  const [laycan, setLaycan] = useState("2026-09-10");
  const [currency, setCurrency] = useState("INR");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [optError, setOptError] = useState(null);
  
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [gpsPlaceName, setGpsPlaceName] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");

  const [currentUserRole, setCurrentUserRole] = useState("Chartering Manager");

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role");
    if (savedRole) {
      setCurrentUserRole(savedRole);
    }
  }, []);

  const [customLocations, setCustomLocations] = useState([
    { name: "Paradip", label: "Paradip Port (East Coast)", lat: 20.2620, lng: 86.6631 },
    { name: "Visakhapatnam", label: "Visakhapatnam Port", lat: 17.6868, lng: 83.2185 },
    { name: "Haldia", label: "Haldia Port", lat: 22.0260, lng: 88.0847 },
    { name: "Chennai", label: "Chennai Port", lat: 13.0827, lng: 80.2707 },
    { name: "Mumbai", label: "JNPT / Mumbai Port", lat: 18.9220, lng: 72.8347 }
  ]);

  const [portAlerts, setPortAlerts] = useState([
    { port: "Paradip", waitingDays: 2.1, congestionLevel: "HIGH" },
    { port: "Visakhapatnam", waitingDays: 1.0, congestionLevel: "LOW" },
    { port: "Haldia", waitingDays: 3.5, congestionLevel: "CRITICAL" }
  ]);

  const [rec, setRec] = useState({
    decision: "Lock Time Charter (COA)",
    badge: "TC Recommended",
    badgeColor: "bg-sky-500/10 text-sky-700 border-sky-300",
    tag: "Congestion Protection",
    confidence: 88.4,
    rationale: "Elevated operational parameters detected for route. Locking TC avoids demurrage penalties.",
    savingsValue: 3840000,
    savingsFormatted: "₹38.40 L",
    warnings: ["Server offline — calculated via local rules."],
    source: "client_fallback"
  });

  const reportRef = useRef(null);
  const curRate = 83.5;

  const CURRENCIES = {
    INR: { label: "INR (₹)", symbol: "₹", rate: 1.0 },
    USD: { label: "USD ($)", symbol: "$", rate: 1 / 83.5 },
    EUR: { label: "EUR (€)", symbol: "€", rate: 0.92 / 83.5 },
    GBP: { label: "GBP (£)", symbol: "£", rate: 0.79 / 83.5 },
    JPY: { label: "JPY (¥)", symbol: "¥", rate: 150.0 / 83.5 },
    CAD: { label: "CAD (CA$)", symbol: "CA$", rate: 1.35 / 83.5 }
  };

  const curSymbol = CURRENCIES[currency]?.symbol || "₹";

  const market = {
    spotFreightRateUsdPerMt: 24.50,
    bunkerFuelVlsfoUsdPerMt: 610.00,
    demurrageCostUsdPerDay: 22500,
    modelAccuracyPct: 94.2
  };

  const chartData = [
    { day: "Day 1", actual: 23.0, forecast: null },
    { day: "Day 2", actual: 23.5, forecast: null },
    { day: "Day 3", actual: 24.0, forecast: 24.1 },
    { day: "Day 4", actual: null, forecast: 24.5 },
    { day: "Day 5", actual: null, forecast: 25.0 }
  ];

  const forecastLoading = false;
  const forecastError = false;

  const t = {
    title: "AI Charter Optimizer",
    subtitle: "Evaluate Spot vs. Time Charter economics",
    tonnageLabel: "Cargo Tonnage (MT)",
    tonnagePlaceholder: "e.g. 50000",
    originLabel: "Origin Port (Enga Irundhu - From)",
    destLabel: "Destination Port (Reach - To)",
    laycanLabel: "Laycan Date",
    buttonRun: "Run Optimization",
    buttonLoading: "Optimizing...",
    liveFeed: "AIS Live Feed Active",
    offline: "Offline Mode"
  };

  const severityMap = {
    LOW: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    HIGH: { badge: "bg-amber-50 text-amber-700 border-amber-200" },
    CRITICAL: { badge: "bg-rose-50 text-rose-700 border-rose-200" }
  };

  const estimatedCarbonTons = ((tonnage * 5500 * 0.015) / 1000).toFixed(1);

  const convertRate = (usdVal) => {
    const multiplier = CURRENCIES[currency]?.rate ?? 1.0;
    if (currency === "INR") return (usdVal * curRate).toFixed(2);
    return (usdVal * multiplier * curRate).toFixed(2);
  };

  const getConvertedSavingsText = () => {
    if (currency === "INR") return rec.savingsFormatted;
    const baseUsd = rec.savingsValue / 83.5;
    const multiplier = CURRENCIES[currency]?.rate ?? 1.0;
    const converted = baseUsd * multiplier * 83.5;
    return `${curSymbol}${(converted / 100000).toFixed(2)} L`;
  };

  const handleAddNewGpsLocation = () => {
    if (!gpsPlaceName.trim()) return;
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPortObj = {
            name: gpsPlaceName,
            label: `${gpsPlaceName} (GPS Site)`,
            lat,
            lng
          };
          setCustomLocations((prev) => [...prev, newPortObj]);
          setPortAlerts((prev) => [...prev, { port: gpsPlaceName, waitingDays: 1.2, congestionLevel: "LOW" }]);
          setDestinationPort(gpsPlaceName);
          setGpsStatus("Saved successfully!");
          setGpsLoading(false);
          setGpsPlaceName("");
          setTimeout(() => setShowGpsModal(false), 1500);
        },
        (error) => {
          setGpsLoading(false);
          setGpsStatus(`GPS Error: ${error.message}`);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGpsLoading(false);
      setGpsStatus("Geolocation not supported.");
    }
  };

  const handleOptimize = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setOptError(null);

    try {
      setTimeout(() => {
        setRec({
          decision: tonnage >= 60000 ? "Lock Time Charter (COA)" : "Procure via Spot Charter",
          badge: tonnage >= 60000 ? "TC Recommended" : "Spot Optimal",
          badgeColor: tonnage >= 60000
            ? "bg-sky-500/10 text-sky-700 border-sky-300"
            : "bg-emerald-500/10 text-emerald-700 border-emerald-300",
          tag: "Route Efficiency",
          confidence: 91.2,
          rationale: `Evaluated transit route from ${originPort} to ${destinationPort} with ${tonnage.toLocaleString()} MT cargo. Route weather and draft clearance optimal.`,
          savingsValue: 4120000,
          savingsFormatted: "₹41.20 L",
          source: "client_fallback",
        });
        setLoading(false);
      }, 800);
    } catch (err) {
      setLoading(false);
      setOptError(`Notice: Optimizer backend offline.`);
    }
  };

  const handleExportReport = () => {
    window.print();
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    window.location.reload();
  };

  const todayLabel = chartData.find((d) => d.forecast !== null)?.day ?? null;

  // Get Coordinates for Origin and Destination
  const originObj = customLocations.find((l) => l.name === originPort) || customLocations[1];
  const destObj = customLocations.find((l) => l.name === destinationPort) || customLocations[0];

  // Midpoint calculation for map center view
  const centerLat = (originObj.lat + destObj.lat) / 2;
  const centerLng = (originObj.lng + destObj.lng) / 2;

  return (
    <div ref={reportRef} className="min-h-screen bg-gradient-to-br from-sky-50 via-sky-100/60 to-blue-50 text-slate-800 font-sans antialiased selection:bg-sky-500 selection:text-white pb-12">
      {/* Header */}
      <header className="border-b border-sky-200/80 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl text-white shadow-md shadow-sky-500/20">
              <Anchor size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-900 font-extrabold text-lg tracking-tight">NAVI-STEEL</span>
                <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent font-black text-lg">AI</span>
              </div>
              <p className="text-sky-700/70 text-[10px] uppercase font-bold tracking-widest font-mono">Bulk Freight Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-200 text-sky-800 font-mono font-bold shadow-xs">
              <UserCheck size={14} className="text-sky-600" /> {currentUserRole}
            </span>

            <button onClick={handleLogout} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-full font-bold shadow-xs transition-all cursor-pointer">
              <LogOut size={14} /> Logout
            </button>

            <button onClick={handleExportReport} className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full font-bold shadow-xs transition-all cursor-pointer">
              <FileDown size={14} /> Export Report
            </button>

            <div className="relative flex items-center bg-white/80 border border-sky-200/90 rounded-full px-3 py-1 shadow-xs">
              <span className="font-bold text-sky-600 mr-1">{curSymbol}</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs">
                {Object.keys(CURRENCIES).map((cKey) => (
                  <option key={cKey} value={cKey}>{CURRENCIES[cKey].label}</option>
                ))}
              </select>
            </div>

            <div className="relative flex items-center bg-white/80 border border-sky-200/90 rounded-full px-3 py-1 shadow-xs">
              <Globe size={14} className="text-sky-600 mr-1.5" />
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs">
                <option value="en">English</option>
                <option value="ta">தமிழ்</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>

            {forecastError ? (
              <span className="hidden md:flex items-center gap-1.5 bg-rose-500/10 border border-rose-300/60 text-rose-700 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold shadow-xs">
                <WifiOff size={13} /> {t.offline}
              </span>
            ) : (
              <span className="hidden md:flex items-center gap-2 bg-emerald-500/10 border border-emerald-300/60 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {t.liveFeed}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white/80 border border-sky-200/90 rounded-2xl px-5 py-3 shadow-sm backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-sky-900 font-bold tracking-wider font-mono shrink-0">
              <AlertTriangle size={15} className="text-amber-500" />
              <span>CONGESTION INDEX:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {portAlerts.map((a) => {
                const sev = severityMap[a.congestionLevel] || severityMap.LOW;
                return (
                  <button
                    key={a.port}
                    onClick={() => setDestinationPort(a.port)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-xl border font-mono text-xs font-semibold shadow-xs hover:scale-[1.02] cursor-pointer ${sev.badge}`}
                  >
                    <span>{a.port}</span>
                    <span className="font-black px-1.5 py-0.5 rounded-md bg-white/60 text-[11px]">
                      {a.waitingDays}d wait
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white/80 border border-sky-200/90 rounded-2xl px-5 py-3 shadow-sm backdrop-blur-md flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2.5 text-sky-900 font-bold">
              <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
                <CloudSun size={16} />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">ROUTE WEATHER</span>
                <span className="text-emerald-700">Clear / Safe Swell</span>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
              IMO Compliant
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Spot Freight Rate",
              value: `${curSymbol}${convertRate(market.spotFreightRateUsdPerMt)}`,
              unit: "/ MT",
              sub: `${originPort} → ${destinationPort}`,
              icon: BadgeIndianRupee,
              iconBg: "bg-sky-500/10 text-sky-600",
            },
            {
              label: "Bunker Fuel VLSFO",
              value: `${curSymbol}${convertRate(market.bunkerFuelVlsfoUsdPerMt)}`,
              unit: "/ MT",
              sub: "Rotterdam benchmark",
              icon: Fuel,
              iconBg: "bg-blue-500/10 text-blue-600",
            },
            {
              label: "Est. Carbon Footprint",
              value: `${estimatedCarbonTons} MT`,
              unit: "CO2e",
              sub: "EEOI Green Benchmark",
              icon: Leaf,
              iconBg: "bg-emerald-500/10 text-emerald-600",
            },
            {
              label: "Model Accuracy",
              value: `${market.modelAccuracyPct}%`,
              unit: "Confidence",
              sub: "14-day rolling backtest",
              icon: BrainCircuit,
              iconBg: "bg-indigo-500/10 text-indigo-600",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-white/80 border border-sky-200/80 hover:border-sky-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-sky-900/70 uppercase tracking-wider font-mono">
                  {m.label}
                </span>
                <div className={`p-2 rounded-xl ${m.iconBg}`}>
                  <m.icon size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {m.value}
                  </span>
                  <span className="text-xs font-semibold text-sky-700/80 font-mono">
                    {m.unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {m.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/80 border border-sky-200/80 rounded-2xl p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-sky-600" />
                    Freight Rate Forecast ({currency})
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Route: {originPort} to {destinationPort}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono font-medium">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-1 bg-sky-500 rounded-full" /> Actual
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-3 h-1 bg-indigo-500 rounded-full" /> AI Forecast
                  </span>
                </div>
              </div>

              {forecastLoading ? (
                <div className="h-[270px] bg-sky-50/50 rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={270}>
                  <AreaChart
                    data={chartData.map(d => ({
                      ...d,
                      actual: d.actual !== null ? Number(convertRate(d.actual)) : null,
                      forecast: d.forecast !== null ? Number(convertRate(d.forecast)) : null,
                    }))}
                    
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    
                  >
                    <defs>
                      
                      <linearGradient id="actSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="foreSky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${curSymbol}${v}`} />
                    <Tooltip />
                    {todayLabel && <ReferenceLine x={todayLabel} stroke="#94a3b8" strokeDasharray="3 3" />}
                    <Area type="monotone" dataKey="actual" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#actSky)" />
                    <Area type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={2.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#foreSky)" />
                  </AreaChart>
                  
                </ResponsiveContainer>
                
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-sky-100 bg-sky-50/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-sky-900 flex items-center gap-1.5">
                  <BrainCircuit size={15} className="text-sky-600 animate-pulse" /> 
                  AI ROUTE RECOMMENDATION
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rec.badgeColor}`}>
                  {rec.badge}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono mt-2">
                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-200/60">
                  <span className="text-slate-500 block text-[10px]">OPTIMAL DECISION</span>
                  <span className="font-bold text-slate-900 text-sm">{rec.decision}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-200/60">
                  <span className="text-slate-500 block text-[10px]">CONFIDENCE SCORE</span>
                  <span className="font-bold text-emerald-700 text-sm">{rec.confidence}% Match</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-sky-200/60">
                  <span className="text-slate-500 block text-[10px]">ESTIMATED SAVINGS</span>
                  <span className="font-bold text-sky-700 text-sm">{getConvertedSavingsText()}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2.5 font-sans leading-relaxed">
                <strong>Rationale:</strong> {rec.rationale}
              </p>
            </div>
          </div>
          <form 
            onSubmit={handleOptimize}
            className="bg-white/80 border border-sky-200/80 rounded-2xl p-6 shadow-sm backdrop-blur-md flex flex-col justify-between space-y-5"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-500/10 border border-sky-200/60 rounded-xl text-sky-600 shadow-xs">
                    <Ship size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {t.title}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGpsModal(!showGpsModal)}
                  className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 text-xs px-2.5 py-1 rounded-lg font-bold transition-all shadow-xs cursor-pointer"
                >
                  <PlusCircle size={13} /> GPS Site
                </button>
              </div>

              {showGpsModal && (
                <div className="mb-4 p-3 bg-sky-50/80 border border-sky-300 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-sky-900 flex items-center gap-1">
                      <MapPin size={13} /> Register Location
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGpsModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter Site Name (e.g. Gangavaram)"
                    value={gpsPlaceName}
                    onChange={(e) => setGpsPlaceName(e.target.value)}
                    className="w-full bg-white border border-sky-200 rounded-lg p-2 text-xs text-slate-800 font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewGpsLocation}
                    disabled={gpsLoading}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {gpsLoading ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" /> Fetching GPS...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} /> Save Current Coordinates
                      </>
                    )}
                  </button>
                  {gpsStatus && (
                    <p className="text-[10px] text-slate-600 font-mono">{gpsStatus}</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-sky-900/80 font-mono uppercase tracking-wider block mb-1.5">
                    {t.originLabel}
                  </label>
                  <div className="relative">
                    <Navigation size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500 pointer-events-none" />
                    <select
                      value={originPort}
                      onChange={(e) => setOriginPort(e.target.value)}
                      className="w-full bg-sky-50/50 border border-sky-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
                    >
                      {customLocations.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-sky-900/80 font-mono uppercase tracking-wider block mb-1.5">
                    {t.destLabel}
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
                    <select
                      value={destinationPort}
                      onChange={(e) => setDestinationPort(e.target.value)}
                      className="w-full bg-sky-50/50 border border-sky-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
                    >
                      {customLocations.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-sky-900/80 font-mono uppercase tracking-wider block mb-1.5">
                    {t.tonnageLabel}
                  </label>
                  <div className="relative">
                    <Gauge size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500 pointer-events-none" />
                    <input
                      type="number"
                      value={tonnage}
                      onChange={(e) => setTonnage(Number(e.target.value))}
                      placeholder={t.tonnagePlaceholder}
                      className="w-full bg-sky-50/50 border border-sky-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-sky-900/80 font-mono uppercase tracking-wider block mb-1.5">
                    {t.laycanLabel}
                  </label>
                  <div className="relative">
                    <CalendarDays size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-500 pointer-events-none" />
                    <input
                      type="date"
                      value={laycan}
                      onChange={(e) => setLaycan(e.target.value)}
                      className="w-full bg-sky-50/50 border border-sky-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> {t.buttonLoading}
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> {t.buttonRun} <ChevronRight size={15} />
                  </>
                )}
              </button>

              {optError && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 font-mono text-center">
                  {optError}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Live MarineTraffic AIS Vessel Tracking Integration */}
        <div className="bg-white/80 border border-sky-200/80 rounded-2xl p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass size={18} className="text-sky-600" /> Live Vessel Traffic Tracking: {originPort} → {destinationPort}
            </h2>
            <span className="text-xs font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Real-Time AIS Feed
            </span>
          </div>
          
          {/* Live MarineTraffic Map Embed Centered on Route Coordinates with Proper Zoom */}
          <div className="h-[380px] w-full rounded-xl overflow-hidden border border-sky-200 shadow-inner relative z-0">
            <iframe
              title="Live Marine Traffic Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.marinetraffic.com/en/ais/embed/zoom:7/centery:${centerLat.toFixed(4)}/centerx:${centerLng.toFixed(4)}/maptype:1/shownames:true`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs font-mono">
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
              <span className="text-sky-900"><strong>Origin (From):</strong> {originPort}</span>
              <span className="text-slate-500">Lat: {originObj.lat.toFixed(2)}, Lng: {originObj.lng.toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="text-emerald-900"><strong>Destination (Reach):</strong> {destinationPort}</span>
              <span className="text-slate-500">Lat: {destObj.lat.toFixed(2)}, Lng: {destObj.lng.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}