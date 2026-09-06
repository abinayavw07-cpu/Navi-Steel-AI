/**
 * GeoNavRadarMap — Unified SVG Tactical Ocean Radar
 * Sky Blue Light Theme · White card · sky-50 canvas
 *
 * All layers unified inside a single SVG canvas with a 6-toggle floating panel:
 *   [ais]     Live AIS Vessel Stream         — animated vessel dot on route
 *   [weather] Satellite Weather & Wave Height — wind vectors + swell heatmap cells
 *   [iceberg] Iceberg & Fog Thermal Radar    — 🧊/❄️ markers, cyan IR rings,
 *                                              fog density overlay, emerald divert path
 *   [fishing] Coastal & Fishing Fleet Radar  — cyan pulsing triangles + voice
 *   [tsunami] Tsunami & Storm Surge Hazards  — flashing 🌊, deep-water evasion route, modal
 *   [debris]  Engine Cooling Intake Debris   — amber polygon, live PSI arc gauge
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Anchor, Layers, X, Volume2, Wrench,
  Snowflake, EyeOff, Radio, Waves, Fish, ShieldAlert,
  CloudRain, Wind, Leaf,
} from "lucide-react";
import { haversineDistance, interpolateRoute, PORT_COORDS } from "../utils/geoCalculator";
import { speakPhrase, speak } from "../utils/speechEngine";

// ─── Projection ───────────────────────────────────────────────────────────────
const VIEW = { latMin: -10, latMax: 32, lngMin: 50, lngMax: 120 };
const W = 900, H = 500;
function project(lat, lng) {
  const x = ((lng - VIEW.lngMin) / (VIEW.lngMax - VIEW.lngMin)) * W;
  const y = ((VIEW.latMax - lat) / (VIEW.latMax - VIEW.latMin)) * H;
  return { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) };
}

// ─── Static map data ──────────────────────────────────────────────────────────
const HAZARDS = [
  { id: "h1", type: "cyclone",   lat: 15.5, lng: 88.0, label: "Cyclone Bay",        color: "#f97316", emoji: "🌀" },
  { id: "h2", type: "hurricane", lat: 22.0, lng: 67.0, label: "Arabian Sea Storm",  color: "#9333ea", emoji: "🌪️" },
  { id: "h3", type: "war",       lat: 13.5, lng: 52.0, label: "Gulf of Aden — HRA", color: "#ef4444", emoji: "💥" },
  { id: "h4", type: "swell",     lat: 8.0,  lng: 77.0, label: "High Swell Zone",    color: "#3b82f6", emoji: "🌊" },
  { id: "h5", type: "cyclone",   lat: 20.0, lng: 95.0, label: "Bay Cyclone Watch",  color: "#f97316", emoji: "🌀" },
];

const FUEL_PORTS = [
  { name: "Fujairah",      lat: 25.12, lng: 56.34,  vlsfo: 578, mgo: 820, type: "VLSFO", color: "#16a34a", ring: "#15803d" },
  { name: "Singapore",     lat: 1.29,  lng: 103.85, vlsfo: 590, mgo: 835, type: "VLSFO", color: "#16a34a", ring: "#15803d" },
  { name: "Colombo",       lat: 6.93,  lng: 79.86,  vlsfo: 600, mgo: 850, type: "LSMGO", color: "#ca8a04", ring: "#a16207" },
  { name: "Port Klang",    lat: 2.99,  lng: 101.37, vlsfo: 585, mgo: 830, type: "VLSFO", color: "#16a34a", ring: "#15803d" },
  { name: "Visakhapatnam", lat: 17.69, lng: 83.22,  vlsfo: 620, mgo: 890, type: "HSFO",  color: "#b45309", ring: "#92400e" },
];

const MAIN_PORTS = [
  { name: "Paradip",       ...PORT_COORDS.Paradip       },
  { name: "Visakhapatnam", ...PORT_COORDS.Visakhapatnam },
  { name: "Haldia",        ...PORT_COORDS.Haldia        },
  { name: "Chennai",       ...PORT_COORDS.Chennai       },
  { name: "Mumbai",        ...PORT_COORDS.Mumbai        },
  { name: "Fujairah",      ...PORT_COORDS.Fujairah      },
  { name: "Singapore",     ...PORT_COORDS.Singapore     },
  { name: "Newcastle",     ...PORT_COORDS.Newcastle     },
];

// ─── Layer 1: Iceberg / Fog data ──────────────────────────────────────────────
// Contacts: risk CRITICAL → 🧊, others → ❄️
const ICE_CONTACTS = [
  { id: "ICE-01", lat: 26.5, lng: 57.5,  dist: 2.1, risk: "CRITICAL", label: "Gulf Growler Cluster"  },
  { id: "ICE-02", lat: 23.8, lng: 60.2,  dist: 4.7, risk: "HIGH",     label: "Arabian Ice Mass"       },
  { id: "ICE-03", lat: 1.5,  lng: 105.5, dist: 6.3, risk: "MEDIUM",   label: "Malacca Strait Drift"   },
  { id: "ICE-04", lat: 25.0, lng: 55.0,  dist: 9.1, risk: "LOW",      label: "Gulf Coastal Growler"   },
];

// Auto-divert waypoints threading between ICE-01 and ICE-02
const ICE_DIVERT_WAYPOINTS = [
  { lat: 24.5, lng: 56.0 },
  { lat: 24.0, lng: 57.0 },
  { lat: 24.2, lng: 58.8 },  // passes south of ICE-01
  { lat: 23.5, lng: 60.0 },
  { lat: 22.8, lng: 61.5 },  // passes north of ICE-02
];

// ─── Layer 0: Satellite weather cells ────────────────────────────────────────
// Grid of (lat,lng) cells each with a swell height and wind speed/direction
const WEATHER_CELLS = [
  // Bay of Bengal / EC India
  { id: "wc01", lat: 18.0, lng: 86.0, swell: 2.1, wind: 18, windDir: 45,  rain: false },
  { id: "wc02", lat: 14.0, lng: 82.0, swell: 3.4, wind: 24, windDir: 30,  rain: true  },
  { id: "wc03", lat: 10.0, lng: 79.0, swell: 1.8, wind: 14, windDir: 90,  rain: false },
  { id: "wc04", lat: 22.0, lng: 90.0, swell: 4.1, wind: 32, windDir: 15,  rain: true  },
  // Arabian Sea
  { id: "wc05", lat: 20.0, lng: 64.0, swell: 2.9, wind: 22, windDir: 225, rain: false },
  { id: "wc06", lat: 15.0, lng: 69.0, swell: 1.5, wind: 12, windDir: 200, rain: false },
  { id: "wc07", lat: 24.0, lng: 60.0, swell: 1.2, wind: 10, windDir: 270, rain: false },
  // Indian Ocean / Gulf of Bengal south
  { id: "wc08", lat: 5.0,  lng: 82.0, swell: 2.4, wind: 18, windDir: 120, rain: false },
  { id: "wc09", lat: 8.0,  lng: 91.0, swell: 3.8, wind: 28, windDir: 60,  rain: true  },
  { id: "wc10", lat: 12.0, lng: 74.0, swell: 1.6, wind: 13, windDir: 315, rain: false },
  { id: "wc11", lat: 17.0, lng: 95.0, swell: 3.1, wind: 26, windDir: 45,  rain: true  },
  { id: "wc12", lat: 25.0, lng: 72.0, swell: 0.8, wind: 8,  windDir: 180, rain: false },
];

// Swell intensity → fill colour (cool blues for calm, warm for rough)
function swellColor(swell) {
  if (swell >= 4.0) return "rgba(239,68,68,0.22)";   // red — extreme
  if (swell >= 3.0) return "rgba(249,115,22,0.20)";  // orange — rough
  if (swell >= 2.0) return "rgba(234,179,8,0.18)";   // amber — moderate
  return               "rgba(59,130,246,0.12)";        // blue — calm
}

// ─── Wind vector arrow (SVG) ─────────────────────────────────────────────────
function WindArrow({ cx, cy, speed, dirDeg, tick }) {
  const len    = 10 + Math.min(speed / 2.5, 14);
  const rad    = (dirDeg - 90) * (Math.PI / 180);
  const ex     = cx + Math.cos(rad) * len;
  const ey     = cy + Math.sin(rad) * len;
  // Arrowhead
  const ahRad1 = rad + 2.7, ahRad2 = rad - 2.7, ahLen = 4;
  const ah1x   = ex + Math.cos(ahRad1) * ahLen;
  const ah1y   = ey + Math.sin(ahRad1) * ahLen;
  const ah2x   = ex + Math.cos(ahRad2) * ahLen;
  const ah2y   = ey + Math.sin(ahRad2) * ahLen;
  const color  = speed >= 28 ? "#ef4444" : speed >= 18 ? "#f97316" : "#3b82f6";
  const op     = 0.7 + 0.2 * Math.sin(tick * 0.08);
  return (
    <g opacity={op}>
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <polyline points={`${ah1x},${ah1y} ${ex},${ey} ${ah2x},${ah2y}`}
        fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    </g>
  );
}

// ─── Swell heatmap cell + wind vector + tooltip ───────────────────────────────
function WeatherCell({ cell, tick, isHov, onEnter, onLeave }) {
  const { x, y } = project(cell.lat, cell.lng);
  const cellR    = 28; // half-width of cell square
  const fill     = swellColor(cell.swell);
  const swellLabel = cell.swell >= 4.0 ? "Extreme" : cell.swell >= 3.0 ? "Rough" :
                     cell.swell >= 2.0 ? "Moderate" : "Calm";
  return (
    <g onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ cursor: "default" }}>
      {/* Heatmap cell */}
      <rect x={x - cellR} y={y - cellR} width={cellR * 2} height={cellR * 2}
        fill={fill} stroke="none" rx="4" />
      {/* Rain indicator */}
      {cell.rain && (
        <text x={x - cellR + 3} y={y - cellR + 10} fontSize="10"
          style={{ userSelect: "none" }} opacity="0.8">🌧</text>
      )}
      {/* Wind vector */}
      <WindArrow cx={x} cy={y} speed={cell.wind} dirDeg={cell.windDir} tick={tick} />
      {/* Swell badge */}
      <foreignObject x={x - 20} y={y + 14} width="40" height="14">
        <div className="text-center text-[7px] font-bold font-mono text-slate-600">
          {cell.swell}m
        </div>
      </foreignObject>
      {/* Hover tooltip */}
      {isHov && (
        <g>
          <foreignObject x={Math.min(x + 4, W - 170)} y={Math.max(y - 28, 2)}
            width="160" height="80" style={{ overflow: "visible" }}>
            <div className="bg-white border border-sky-200 text-slate-800 text-[10px] rounded-xl px-2.5 py-2 shadow-lg font-mono leading-relaxed pointer-events-none">
              <div className="font-bold text-blue-700">🌊 Swell: {cell.swell}m — {swellLabel}</div>
              <div className="text-slate-600">💨 Wind: {cell.wind} kts @ {cell.windDir}°</div>
              <div className="text-slate-500">{cell.rain ? "🌧 Rain / Squall active" : "☀️ No precipitation"}</div>
              <div className="text-slate-400 text-[9px]">{cell.lat.toFixed(1)}°N {cell.lng.toFixed(1)}°E</div>
            </div>
          </foreignObject>
        </g>
      )}
    </g>
  );
}

// ─── Layer 2: Fishing skiffs ──────────────────────────────────────────────────
const FISHING_SKIFFS = [
  { id: "fs1", lat: 16.8, lng: 82.5, prox: 0.8, speed: 4, heading: "NE" },
  { id: "fs2", lat: 13.2, lng: 80.3, prox: 1.4, speed: 3, heading: "NW" },
  { id: "fs3", lat: 21.5, lng: 88.7, prox: 2.1, speed: 5, heading: "E"  },
  { id: "fs4", lat: 9.8,  lng: 76.3, prox: 0.5, speed: 2, heading: "S"  },
  { id: "fs5", lat: 18.3, lng: 84.1, prox: 3.2, speed: 6, heading: "SW" },
  { id: "fs6", lat: 6.5,  lng: 79.9, prox: 1.9, speed: 4, heading: "NE" },
];

// ─── Layer 3: Tsunami zones ────────────────────────────────────────────────────
const TSUNAMI_ZONES = [
  { id: "ts1", lat: 12.5, lng: 93.5, label: "Andaman Seismic Zone",  severity: "CRITICAL" },
  { id: "ts2", lat: 8.0,  lng: 81.5, label: "Sri Lanka Surge Coast", severity: "HIGH"     },
  { id: "ts3", lat: 20.5, lng: 86.7, label: "Odisha Shallow Shelf",  severity: "HIGH"     },
];
const TSUNAMI_EVASION = [
  { lat: 12.5, lng: 93.5 },
  { lat: 11.0, lng: 91.0 },
  { lat: 9.0,  lng: 89.0 },
  { lat: 7.0,  lng: 87.0 },
];

// ─── Layer 5: Eco-sensitive zones ────────────────────────────────────────────
const ECO_ZONES = [
  {
    id: "eco1",
    name: "Gulf of Mannar Biosphere",
    points: [[8.8,78.1],[8.2,78.8],[8.5,79.5],[9.2,79.3],[9.4,78.6]],
    restriction: "NO BALLAST DISCHARGE · Speed limit 8 kts",
    category: "Marine Biosphere Reserve",
  },
  {
    id: "eco2",
    name: "Sundarbans Delta — Critical Habitat",
    points: [[21.6,88.2],[21.2,89.0],[21.8,89.7],[22.4,89.2],[22.2,88.5]],
    restriction: "NO HORN NOISE · Anti-Poaching Zone",
    category: "UNESCO World Heritage",
  },
  {
    id: "eco3",
    name: "Andaman Coral Reef Sanctuary",
    points: [[11.6,92.7],[11.2,93.3],[11.8,93.9],[12.3,93.4],[12.1,92.8]],
    restriction: "CORAL PROTECTION — No anchor drop",
    category: "Ramsar Wetland",
  },
  {
    id: "eco4",
    name: "Chilika Lake Eco-Buffer",
    points: [[19.4,85.0],[19.0,85.5],[19.3,85.9],[19.9,85.6],[20.0,85.1]],
    restriction: "REDUCED SPEED ZONE — Dolphin habitat",
    category: "Ramsar Wetland",
  },
];

// ─── Eco-zone polygon (green hatched) ────────────────────────────────────────
function EcoZonePolygon({ zone, tick, isHov, onEnter, onLeave }) {
  const pts      = zone.points.map(([lat, lng]) => project(lat, lng));
  const ptStr    = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const centroid = pts.reduce(
    (a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }),
    { x: 0, y: 0 }
  );
  const pulseOp = 0.50 + 0.18 * Math.sin(tick * 0.09 + zone.points[0][0]);
  const patId   = `eco-hatch-${zone.id}`;
  return (
    <g onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <defs>
        <pattern id={patId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#16a34a" strokeWidth="2" opacity="0.45" />
        </pattern>
      </defs>
      {/* Hatched fill */}
      <polygon points={ptStr} fill={`url(#${patId})`} opacity={pulseOp * 0.85} />
      {/* Border */}
      <polygon points={ptStr} fill="none" stroke="#16a34a" strokeWidth="1.8"
        strokeDasharray="6 3" opacity={pulseOp} />
      {/* Leaf icon text */}
      <text x={centroid.x} y={centroid.y + 5} textAnchor="middle" fontSize="13"
        style={{ userSelect: "none" }} opacity={0.85}>🌿</text>
      {/* Label badge */}
      <foreignObject x={Math.max(4, Math.min(centroid.x - 40, W - 84))} y={centroid.y + 14} width="84" height="18">
        <div className="text-center text-[7px] font-bold font-mono bg-emerald-50/90 text-emerald-800 border border-emerald-300 rounded-full px-1 py-0.5 leading-tight">
          {zone.name.split(" ").slice(0, 3).join(" ")}
        </div>
      </foreignObject>
      {/* Hover tooltip */}
      {isHov && (
        <MapTooltip x={centroid.x} y={centroid.y} width={185} height={80}>
          <div className="font-bold text-emerald-800">🌿 {zone.name}</div>
          <div className="text-emerald-700 text-[9px] font-bold">{zone.category}</div>
          <div className="text-slate-500 text-[9px] mt-0.5">{zone.restriction}</div>
        </MapTooltip>
      )}
    </g>
  );
}

// ─── Layer 4: Debris zones ────────────────────────────────────────────────────
const DEBRIS_ZONES = [
  {
    id: "deb1", label: "Ganga River-Mouth Debris", intake: "HIGH",
    points: [[22.2,88.1],[21.8,88.6],[21.5,89.2],[22.0,89.5],[22.5,88.8]],
  },
  {
    id: "deb2", label: "Mahanadi Delta Plastic Zone", intake: "MEDIUM",
    points: [[20.3,86.6],[20.0,87.0],[19.7,87.4],[20.1,87.8],[20.5,87.2]],
  },
];

// ─── Risk config for ice contacts ─────────────────────────────────────────────
const ICE_RISK = {
  CRITICAL: { ring: "#ef4444", fill: "rgba(254,226,226,0.35)", badge: "bg-red-100 text-red-800 border-red-300",    emoji: "🧊" },
  HIGH:     { ring: "#f97316", fill: "rgba(255,237,213,0.35)", badge: "bg-amber-100 text-amber-800 border-amber-300", emoji: "❄️" },
  MEDIUM:   { ring: "#22d3ee", fill: "rgba(207,250,254,0.35)", badge: "bg-cyan-100 text-cyan-800 border-cyan-300",   emoji: "❄️" },
  LOW:      { ring: "#22d3ee", fill: "rgba(207,250,254,0.20)", badge: "bg-sky-100 text-sky-800 border-sky-200",      emoji: "❄️" },
};

// ─── SVG Tooltip ──────────────────────────────────────────────────────────────
function MapTooltip({ x, y, width = 165, height = 90, children }) {
  const tx = Math.min(x + 8, W - width - 4);
  const ty = Math.max(y - 24, 4);
  return (
    <foreignObject x={tx} y={ty} width={width} height={height} style={{ overflow: "visible" }}>
      <div className="bg-white border border-sky-200 text-slate-800 text-[10px] rounded-xl px-2.5 py-2 shadow-lg font-mono leading-relaxed pointer-events-none">
        {children}
      </div>
    </foreignObject>
  );
}

// ─── Ice contact marker (🧊 CRITICAL | ❄️ others) ─────────────────────────────
function IceContactMarker({ contact, tick, isHov, onEnter, onLeave, onClick }) {
  const cfg   = ICE_RISK[contact.risk] ?? ICE_RISK.LOW;
  const { x, y } = project(contact.lat, contact.lng);
  const blink = Math.sin(tick * 0.18) > 0;
  // outer IR ring pulsing opacity
  const ringOp = 0.55 + 0.3 * Math.sin(tick * 0.12);
  return (
    <g onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick}
      style={{ cursor: "pointer" }}>
      {/* Sub-surface blob */}
      <circle cx={x} cy={y} r={20} fill={cfg.fill} stroke={cfg.ring}
        strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
      {/* Infrared thermal radius ring */}
      <circle cx={x} cy={y} r={26}
        fill="none" stroke={cfg.ring} strokeWidth="1.5" strokeDasharray="5 4"
        opacity={ringOp} />
      {contact.risk === "CRITICAL" && (
        <circle cx={x} cy={y} r={34}
          fill="none" stroke={cfg.ring} strokeWidth="0.8"
          opacity={0.3 + 0.2 * Math.sin(tick * 0.09)}
          style={{ animation: "geoRingPulse 1.5s ease-out infinite" }} />
      )}
      {/* Solid fill dot */}
      <circle cx={x} cy={y} r={isHov ? 11 : 9}
        fill={contact.risk === "CRITICAL" ? "rgba(239,68,68,0.15)" : "rgba(186,230,253,0.3)"}
        stroke={cfg.ring} strokeWidth="2" />
      {/* Emoji marker (blinks for CRITICAL) */}
      <text x={x} y={y + 5} textAnchor="middle" fontSize="13"
        opacity={contact.risk === "CRITICAL" ? (blink ? 1 : 0.4) : 0.9}
        style={{ userSelect: "none", transition: "opacity 0.15s" }}>
        {cfg.emoji}
      </text>
      {/* Distance badge above */}
      <foreignObject x={x - 28} y={y - 34} width="56" height="18">
        <div className={`text-center text-[8px] font-bold font-mono px-1 py-0.5 rounded-full border ${cfg.badge}`}>
          {contact.dist} NM
        </div>
      </foreignObject>
      {/* Hover tooltip */}
      {isHov && (
        <MapTooltip x={x} y={y} height={80}>
          <div className="font-bold text-cyan-800">{cfg.emoji} {contact.id}</div>
          <div className="text-cyan-600 text-[9px]">{contact.label}</div>
          <div className="text-slate-600">Ice Hazard: <span className="font-bold">{contact.dist} NM ahead</span></div>
          <div className={`font-bold text-[9px] mt-0.5 ${
            contact.risk === "CRITICAL" ? "text-red-600" : "text-amber-600"}`}>
            {contact.risk} — Thermal sonar active
          </div>
        </MapTooltip>
      )}
    </g>
  );
}

// ─── Ice auto-divert path ─────────────────────────────────────────────────────
function IceDivertPath() {
  const pts = ICE_DIVERT_WAYPOINTS.map(({ lat, lng }) => project(lat, lng));
  const d   = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <path d={d} fill="none" stroke="#10b981" strokeWidth="2.5"
      strokeDasharray="10 5" strokeLinecap="round" opacity="0.88" />
  );
}

// ─── Fishing skiff triangle ───────────────────────────────────────────────────
function SkiffMarker({ skiff, tick, isHov, onEnter, onLeave, onClick }) {
  const { x, y } = project(skiff.lat, skiff.lng);
  const isCrit   = skiff.prox < 1.0;
  const color    = isCrit ? "#0e7490" : "#06b6d4";
  const size     = isHov ? 11 : 9;
  const h        = size * Math.sqrt(3) / 2;
  const pts      = `${x},${y - h * 0.67} ${x - size / 2},${y + h * 0.33} ${x + size / 2},${y + h * 0.33}`;
  return (
    <g onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick}
      style={{ cursor: "pointer" }}>
      {isCrit && (
        <circle cx={x} cy={y} r={size * 2.2}
          fill="none" stroke={color} strokeWidth="1" opacity="0.35"
          style={{ animation: "geoRingPulse 1.6s ease-out infinite" }} />
      )}
      <polygon points={pts} fill={color} stroke="white" strokeWidth="1.5" opacity="0.92" />
      {isHov && (
        <MapTooltip x={x} y={y} height={82}>
          <div className="font-bold text-cyan-800">🐟 Fishing Skiff {skiff.id}</div>
          <div className="text-cyan-700">Proximity: <span className="font-bold">{skiff.prox} NM</span></div>
          <div className="text-slate-600">Speed: {skiff.speed} kts · Hdg: {skiff.heading}</div>
          <div className={`font-bold text-[9px] mt-0.5 ${isCrit ? "text-red-600" : "text-amber-600"}`}>
            {isCrit ? "⚠ CLOSE QUARTERS" : "Monitor proximity"}
          </div>
        </MapTooltip>
      )}
    </g>
  );
}

// ─── Tsunami zone marker ──────────────────────────────────────────────────────
function TsunamiMarker({ zone, tick, onClick }) {
  const { x, y } = project(zone.lat, zone.lng);
  const color     = zone.severity === "CRITICAL" ? "#ef4444" : "#f97316";
  const flashing  = Math.sin(tick * 0.25) > 0;
  return (
    <g onClick={() => onClick(zone)} style={{ cursor: "pointer" }}>
      <circle cx={x} cy={y} r={30} fill={color} opacity={0.06}
        style={{ animation: "geoRingPulse 1.2s ease-out infinite" }} />
      <circle cx={x} cy={y} r={18} fill={color} opacity={0.13} />
      <circle cx={x} cy={y} r={30} fill="transparent" />
      <text x={x} y={y + 7} textAnchor="middle" fontSize="20"
        opacity={flashing ? 0.95 : 0.45}
        style={{ userSelect: "none", transition: "opacity 0.15s" }}>🌊</text>
      <foreignObject x={Math.min(x - 32, W - 104)} y={y + 26} width="104" height="20">
        <div className={`text-center text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full border
          ${zone.severity === "CRITICAL"
            ? "bg-red-100 text-red-800 border-red-300"
            : "bg-amber-100 text-amber-800 border-amber-300"}`}>
          {zone.label.split(" ").slice(0, 3).join(" ")}
        </div>
      </foreignObject>
    </g>
  );
}

// ─── Tsunami evasion path ─────────────────────────────────────────────────────
function TsunamiEvasionPath() {
  const pts = TSUNAMI_EVASION.map(({ lat, lng }) => project(lat, lng));
  const d   = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const ep  = pts[pts.length - 1];
  return (
    <>
      <path d={d} fill="none" stroke="#22c55e" strokeWidth="2.5"
        strokeDasharray="10 5" strokeLinecap="round" opacity="0.85" />
      <text x={ep.x} y={ep.y + 5} textAnchor="middle" fontSize="12"
        style={{ userSelect: "none" }}>⚓</text>
      <foreignObject x={ep.x - 38} y={ep.y + 10} width="76" height="16">
        <div className="text-[8px] font-bold font-mono text-emerald-700 text-center">DEEP ANCHORAGE</div>
      </foreignObject>
    </>
  );
}

// ─── Debris polygon ───────────────────────────────────────────────────────────
function DebrisPolygon({ zone, tick, isHov }) {
  const pts      = zone.points.map(([lat, lng]) => project(lat, lng));
  const ptStr    = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const centroid = pts.reduce(
    (a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }),
    { x: 0, y: 0 }
  );
  const color = zone.intake === "HIGH" ? "#f59e0b" : "#fb923c";
  const pulseOp = 0.45 + 0.2 * Math.sin(tick * 0.1);
  return (
    <g>
      <polygon points={ptStr} fill={color} stroke={color} strokeWidth="2"
        fillOpacity={pulseOp * 0.35} strokeOpacity={pulseOp} strokeDasharray="6 3" />
      <text x={centroid.x} y={centroid.y + 4} textAnchor="middle" fontSize="12"
        style={{ userSelect: "none" }}>🗑️</text>
      {isHov && (
        <MapTooltip x={centroid.x} y={centroid.y} height={68}>
          <div className="font-bold text-amber-800">⚠ {zone.label}</div>
          <div className="text-slate-500">Intake risk: <span className="font-bold text-amber-700">{zone.intake}</span></div>
          <div className="text-slate-400">Macro-debris / Plastic Zone</div>
        </MapTooltip>
      )}
    </g>
  );
}

// ─── PSI arc gauge ────────────────────────────────────────────────────────────
function PsiGauge({ psi }) {
  const pct   = Math.min(psi / 100, 1);
  const color = psi > 80 ? "#ef4444" : psi > 55 ? "#f97316" : "#22c55e";
  const label = psi > 80 ? "CRITICAL" : psi > 55 ? "HIGH" : "NORMAL";
  const r = 26, cx = 36, cy = 38;
  const sa  = Math.PI, ea = Math.PI + pct * Math.PI;
  const x1  = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
  const x2  = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
  const lg  = pct > 0.5 ? 1 : 0;
  return (
    <svg viewBox="0 0 72 52" className="w-full max-w-[76px]">
      <path d={`M${x1},${y1} A${r},${r} 0 0,1 ${cx + r},${cy}`}
        fill="none" stroke="#e2e8f0" strokeWidth="7" strokeLinecap="round" />
      <path d={`M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}`}
        fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="900"
        fontFamily="monospace" fill={color}>{psi}</text>
      <text x={cx} y={cy + 6}  textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#94a3b8">PSI</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="6" fontFamily="monospace" fill={color}>{label}</text>
    </svg>
  );
}

// ─── Fog density widget ───────────────────────────────────────────────────────
function FogWidget({ visibility }) {
  const color = visibility < 20 ? "#ef4444" : visibility < 40 ? "#f97316" : visibility < 60 ? "#eab308" : "#22c55e";
  const label = visibility < 20 ? "EXTREME FOG" : visibility < 40 ? "DENSE FOG" : visibility < 60 ? "PATCHY FOG" : "CLEAR";
  const r = 22, cx = 30, cy = 32;
  const sa  = Math.PI, ea = Math.PI + (visibility / 100) * Math.PI;
  const x1  = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
  const x2  = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
  const lg  = visibility > 50 ? 1 : 0;
  return (
    <div className="absolute top-3 left-3 z-10 bg-white/95 border border-sky-200 shadow-md rounded-xl p-2.5 backdrop-blur-sm w-[130px]">
      <div className="flex items-center gap-1.5 mb-1">
        <EyeOff size={11} className="text-violet-500 shrink-0" />
        <span className="text-[9px] font-black font-mono uppercase tracking-wider text-slate-700">Fog Density</span>
      </div>
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 60 42" className="w-[60px] shrink-0">
          <path d={`M${x1},${y1} A${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <path d={`M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}`}
            fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="9" fontWeight="900"
            fontFamily="monospace" fill={color}>{visibility.toFixed(0)}%</text>
        </svg>
        <div>
          <div className="text-[8px] font-mono text-slate-500">Visibility</div>
          <div className="text-[8px] font-bold font-mono" style={{ color }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

// ─── 7-layer floating toggle panel ───────────────────────────────────────────
const LAYER_META = [
  { key: "ais",     label: "Live AIS Vessel Stream",          Icon: Radio,     color: "text-sky-600"     },
  { key: "weather", label: "Satellite Weather & Wave Height", Icon: CloudRain, color: "text-blue-600"    },
  { key: "iceberg", label: "Iceberg & Fog Thermal Radar",     Icon: Snowflake, color: "text-cyan-600"    },
  { key: "fishing", label: "Fishing Fleet Skiffs",            Icon: Fish,      color: "text-teal-600"    },
  { key: "tsunami", label: "Tsunami & Seismic Surges",        Icon: Waves,     color: "text-red-500"     },
  { key: "debris",  label: "Engine Debris & Intake PSI",      Icon: Wrench,    color: "text-amber-600"   },
  { key: "ecozone", label: "Eco-Sensitive Marine Zones",      Icon: Leaf,      color: "text-emerald-600" },
];

function LayerTogglePanel({ layers, setLayers }) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(layers).filter(Boolean).length;
  return (
    <div className="absolute top-3 right-3 z-20">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-white/95 border border-sky-200 shadow-md rounded-xl px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 transition-all cursor-pointer backdrop-blur-sm">
        <Layers size={13} />
        Overlays
        <span className="ml-1 bg-sky-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
          {activeCount}
        </span>
      </button>

      {open && (
        <div className="absolute top-10 right-0 bg-white/98 border border-sky-200 shadow-xl rounded-xl p-3 w-60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-black font-mono uppercase tracking-wider text-slate-500">
              Map Overlays
            </span>
            <button type="button" onClick={() => setOpen(false)}
              className="p-0.5 rounded hover:bg-slate-100 cursor-pointer">
              <X size={11} className="text-slate-400" />
            </button>
          </div>

          <div className="space-y-2">
            {LAYER_META.map(({ key, label, Icon, color }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={layers[key]}
                  onChange={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
                  className="accent-sky-500 w-3.5 h-3.5 cursor-pointer shrink-0" />
                <Icon size={12} className={`${color} shrink-0`} />
                <span className="text-[11px] font-mono font-semibold text-slate-700
                  group-hover:text-sky-700 transition-colors leading-tight">
                  {label}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-sky-100 flex gap-1.5">
            <button type="button"
              onClick={() => setLayers({ ais: true, weather: true, iceberg: true, fishing: true, tsunami: true, debris: true, ecozone: true })}
              className="flex-1 text-[9px] font-bold font-mono py-1.5 rounded-lg bg-sky-50 border border-sky-200
                text-sky-700 hover:bg-sky-100 cursor-pointer transition-all">
              ALL ON
            </button>
            <button type="button"
              onClick={() => setLayers({ ais: false, weather: false, iceberg: false, fishing: false, tsunami: false, debris: false, ecozone: false })}
              className="flex-1 text-[9px] font-bold font-mono py-1.5 rounded-lg bg-slate-50 border border-slate-200
                text-slate-500 hover:bg-slate-100 cursor-pointer transition-all">
              ALL OFF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tsunami emergency modal ──────────────────────────────────────────────────
function TsunamiModal({ zone, onClose, language }) {
  useEffect(() => {
    speak(
      `TSUNAMI ALERT: ${zone.label}. Initiate deep-water evacuation immediately. All crew to emergency stations.`,
      language
    );
  }, [zone, language]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-red-400 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-red-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌊</span>
            <div>
              <p className="text-white font-black text-sm">TSUNAMI ALERT</p>
              <p className="text-red-200 text-[10px] font-mono">IMO MSC Emergency Protocol Active</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg bg-red-500 hover:bg-red-400 cursor-pointer transition-all">
            <X size={14} className="text-white" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs font-bold text-red-800">{zone.label}</p>
            <p className="text-[11px] font-mono text-red-600 mt-0.5">
              Severity: <span className="font-black">{zone.severity}</span> · Seismic Surge Detected
            </p>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-mono">
            Initiate <span className="font-black text-red-700">Deep-Water Evacuation Protocol</span>.
            Navigate to open sea depth &gt;200m. Avoid all coastal shallows.
          </p>
          {[
            "Increase speed to maximum safe RPM",
            "Alter course away from shallow coast",
            "Alert all crew — muster stations",
            "Broadcast MAYDAY on VHF Ch.16",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-700">
              <span className="w-5 h-5 rounded-full bg-red-100 border border-red-300 text-red-700 flex items-center justify-center text-[9px] font-black shrink-0">
                {i + 1}
              </span>
              {step}
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-red-100 bg-red-50 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer transition-all">
            ACKNOWLEDGE & DIVERT
          </button>
          <button type="button"
            onClick={() => speak(`TSUNAMI ALERT: ${zone.label}. Initiate deep-water evacuation immediately.`, language)}
            className="p-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 cursor-pointer transition-all">
            <Volume2 size={14} className="text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GeoNavRadarMap({
  originPort = "Visakhapatnam", destPort = "Paradip",
  currency = "USD", exchangeRate = 1, curSymbol = "$",
  language = "en", isOnline = true,
}) {
  const [hoveredHazard,  setHoveredHazard]  = useState(null);
  const [hoveredFuel,    setHoveredFuel]    = useState(null);
  const [hoveredPort,    setHoveredPort]    = useState(null);
  const [hoveredSkiff,   setHoveredSkiff]   = useState(null);
  const [hoveredDebris,  setHoveredDebris]  = useState(null);
  const [hoveredIce,     setHoveredIce]     = useState(null);
  const [vesselProgress, setVesselProgress] = useState(0);
  const [tick,           setTick]           = useState(0);
  const [tsunamiModal,   setTsunamiModal]   = useState(null);

  // 7-layer toggle state — each key maps to a boolean
  const [layers, setLayers] = useState({
    ais: true, weather: true, iceberg: true, fishing: true, tsunami: true, debris: true, ecozone: true,
  });
  const [hoveredEco, setHoveredEco] = useState(null);
  const [hoveredWeather, setHoveredWeather] = useState(null);

  // Live simulated values — only change on mount/unmount, not on layer toggle
  const [intakePsi,    setIntakePsi]    = useState(47);
  const [visibility,   setVisibility]   = useState(42);
  const animRef = useRef(null);

  // Vessel animation + tick (independent of layer state)
  useEffect(() => {
    animRef.current = setInterval(() => {
      setVesselProgress((p) => (p >= 100 ? 0 : p + 0.3));
      setTick((t) => t + 1);
    }, 80);
    return () => clearInterval(animRef.current);
  }, []);

  // Live PSI simulation
  useEffect(() => {
    const id = setInterval(() => {
      setIntakePsi((v) => parseFloat(Math.max(10, Math.min(95, v + (Math.random() - 0.48) * 6)).toFixed(0)));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // Fog visibility simulation (runs whenever iceberg layer is shown)
  useEffect(() => {
    if (!layers.iceberg) return;
    const id = setInterval(() => {
      setVisibility((v) => parseFloat(Math.max(5, Math.min(95, v + (Math.random() - 0.52) * 8)).toFixed(1)));
    }, 1800);
    return () => clearInterval(id);
  }, [layers.iceberg]);

  const oCoords        = PORT_COORDS[originPort] ?? PORT_COORDS.Visakhapatnam;
  const dCoords        = PORT_COORDS[destPort]   ?? PORT_COORDS.Paradip;
  const routeWaypoints = interpolateRoute(oCoords.lat, oCoords.lng, dCoords.lat, dCoords.lng, 16);
  const routePoints    = routeWaypoints.map((p) => project(p.lat, p.lng));
  const polyline       = routePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const vesselIdx      = Math.floor((vesselProgress / 100) * (routePoints.length - 1));
  const vesselPos      = routePoints[Math.min(vesselIdx, routePoints.length - 1)] ?? routePoints[0];
  const dist           = haversineDistance(oCoords.lat, oCoords.lng, dCoords.lat, dCoords.lng);
  const fmtPrice       = (usd) => `${curSymbol}${Math.round(usd * exchangeRate).toLocaleString()}`;

  const handleSkiffClick = useCallback((skiff) => {
    speak(
      `Warning! Small fishing craft detected. ID ${skiff.id}. Proximity ${skiff.prox} nautical miles. Speed ${skiff.speed} knots.`,
      language
    );
  }, [language]);

  const handleIceClick = useCallback((contact) => {
    speak(
      `Ice hazard ${contact.id} detected at ${contact.dist} nautical miles. ${contact.label}. Severity ${contact.risk}. Auto-divert course active.`,
      language
    );
  }, [language]);

  return (
    <>
      <style>{`
        @keyframes geoRingPulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          70%  { transform: scale(1.5); opacity: 0.1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      {tsunamiModal && (
        <TsunamiModal zone={tsunamiModal} onClose={() => setTsunamiModal(null)} language={language} />
      )}

      <div className="bg-white border border-sky-200 rounded-2xl overflow-hidden shadow-sm">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-sky-100 bg-sky-50/60">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Anchor size={16} className="text-sky-600" />
            GeoNav Tactical Radar
            <span className="text-slate-400 font-normal text-xs">— Indian Ocean · Bay of Bengal</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-500">
              Route: <span className="text-sky-700 font-bold">{originPort} → {destPort}</span>
            </span>
            <span className="text-slate-500">
              Dist: <span className="text-emerald-700 font-bold">{dist.nm} NM</span>
            </span>
            {/* Active layer chips */}
            {layers.weather && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold">
                <Wind size={9} />Weather
              </span>
            )}
            {layers.iceberg && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold">
                <Snowflake size={9} />Ice Radar
              </span>
            )}
            {layers.fishing && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 font-bold">
                <Fish size={9} />Fleet
              </span>
            )}
            {layers.tsunami && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold">
                <Waves size={9} />Tsunami
              </span>
            )}
            {layers.ecozone && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                <Leaf size={9} />Eco-Zones
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full font-bold border ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50  text-amber-700  border-amber-200"
            }`}>
              {isOnline ? "● AIS Live" : "○ Cached"}
            </span>
          </div>
        </div>

        {/* ── SVG canvas wrapper ──────────────────────────────────────────── */}
        <div className="relative overflow-x-auto">

          {/* Floating layer toggle — top right */}
          <LayerTogglePanel layers={layers} setLayers={setLayers} />

          {/* Fog density widget — top left (only when iceberg layer active) */}
          {layers.iceberg && <FogWidget visibility={visibility} />}

          {/* Debris PSI gauge — bottom left (only when debris layer active) */}
          {layers.debris && (
            <div className="absolute bottom-3 left-3 z-10 bg-white/95 border border-amber-200 shadow-md rounded-xl p-2.5 backdrop-blur-sm w-36">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wrench size={11} className="text-amber-600 shrink-0" />
                <span className="text-[9px] font-black font-mono uppercase tracking-wider text-amber-800">
                  Cooling Intake
                </span>
              </div>
              <PsiGauge psi={intakePsi} />
              <p className="text-[8px] font-mono text-slate-400 text-center mt-1">Debris PSI Monitor</p>
            </div>
          )}

          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px]"
            style={{ background: "linear-gradient(180deg,#e0f2fe 0%,#bae6fd 40%,#7dd3fc 100%)" }}>

            <defs>
              <pattern id="geonav-lgrid" width="45" height="25" patternUnits="userSpaceOnUse">
                <path d="M 45 0 L 0 0 0 25" fill="none" stroke="#93c5fd" strokeWidth="0.4" opacity="0.5" />
              </pattern>
              {/* Fog overlay filter */}
              <filter id="fogBlur">
                <feGaussianBlur stdDeviation={Math.max(0, (100 - visibility) / 35)} />
              </filter>
            </defs>
            <rect width={W} height={H} fill="url(#geonav-lgrid)" />

            {/* Lat lines */}
            {[0, 10, 20, 30].map((lat) => {
              const { y } = project(lat, VIEW.lngMin);
              return <line key={lat} x1="0" y1={y} x2={W} y2={y} stroke="#7dd3fc" strokeWidth="0.5" opacity="0.7" />;
            })}

            {/* Indian subcontinent silhouette */}
            <path d="M520,80 L545,95 L560,115 L555,145 L570,170 L580,200 L560,225 L540,235 L510,250 L490,240 L480,215 L470,185 L465,155 L475,130 L495,110 Z"
              fill="#d1fae5" stroke="#6ee7b7" strokeWidth="0.8" opacity="0.6" />
            <path d="M533,248 L540,258 L537,270 L525,268 L522,255 Z"
              fill="#d1fae5" stroke="#6ee7b7" strokeWidth="0.6" opacity="0.6" />

            {/* ─────────────────────────────────────────────────────────────
                LAYER: ECO-ZONE hatched polygons (bottommost — below weather)
            ───────────────────────────────────────────────────────────── */}
            {layers.ecozone && ECO_ZONES.map((zone) => (
              <EcoZonePolygon key={zone.id} zone={zone} tick={tick}
                isHov={hoveredEco === zone.id}
                onEnter={() => setHoveredEco(zone.id)}
                onLeave={() => setHoveredEco(null)} />
            ))}

            {/* ─────────────────────────────────────────────────────────────
                LAYER: WEATHER swell heatmap + wind vectors
            ───────────────────────────────────────────────────────────── */}
            {layers.weather && WEATHER_CELLS.map((cell) => (
              <WeatherCell key={cell.id} cell={cell} tick={tick}
                isHov={hoveredWeather === cell.id}
                onEnter={() => setHoveredWeather(cell.id)}
                onLeave={() => setHoveredWeather(null)} />
            ))}

            {/* ─────────────────────────────────────────────────────────────
                LAYER: DEBRIS (bottom — behind route)
            ───────────────────────────────────────────────────────────── */}
            {layers.debris && DEBRIS_ZONES.map((zone) => (
              <g key={zone.id}
                onMouseEnter={() => setHoveredDebris(zone.id)}
                onMouseLeave={() => setHoveredDebris(null)}>
                <DebrisPolygon zone={zone} tick={tick} isHov={hoveredDebris === zone.id} />
              </g>
            ))}

            {/* ─────────────────────────────────────────────────────────────
                LAYER: TSUNAMI evasion path (dashed green)
            ───────────────────────────────────────────────────────────── */}
            {layers.tsunami && <TsunamiEvasionPath />}

            {/* ─────────────────────────────────────────────────────────────
                LAYER: ICE auto-divert emerald path
            ───────────────────────────────────────────────────────────── */}
            {layers.iceberg && <IceDivertPath />}

            {/* Main vessel route polyline */}
            <path d={polyline} stroke="#0369a1" strokeWidth="2.5" fill="none"
              strokeDasharray="9 5" opacity="0.85" />

            {/* ─────────────────────────────────────────────────────────────
                LAYER: TSUNAMI zone markers (clickable → modal)
            ───────────────────────────────────────────────────────────── */}
            {layers.tsunami && TSUNAMI_ZONES.map((zone) => (
              <TsunamiMarker key={zone.id} zone={zone} tick={tick}
                onClick={setTsunamiModal} />
            ))}

            {/* ─────────────────────────────────────────────────────────────
                LAYER: ICE contact markers (🧊/❄️ + IR rings + distance badge)
            ───────────────────────────────────────────────────────────── */}
            {layers.iceberg && ICE_CONTACTS.map((contact) => (
              <IceContactMarker key={contact.id} contact={contact} tick={tick}
                isHov={hoveredIce === contact.id}
                onEnter={() => setHoveredIce(contact.id)}
                onLeave={() => setHoveredIce(null)}
                onClick={() => handleIceClick(contact)} />
            ))}

            {/* ─────────────────────────────────────────────────────────────
                LAYER: FISHING skiff triangles
            ───────────────────────────────────────────────────────────── */}
            {layers.fishing && FISHING_SKIFFS.map((skiff) => (
              <SkiffMarker key={skiff.id} skiff={skiff} tick={tick}
                isHov={hoveredSkiff === skiff.id}
                onEnter={() => setHoveredSkiff(skiff.id)}
                onLeave={() => setHoveredSkiff(null)}
                onClick={() => handleSkiffClick(skiff)} />
            ))}

            {/* Existing weather hazard markers */}
            {HAZARDS.map((h) => {
              const { x, y } = project(h.lat, h.lng);
              const isHov = hoveredHazard?.id === h.id;
              return (
                <g key={h.id}
                  onMouseEnter={() => setHoveredHazard(h)}
                  onMouseLeave={() => setHoveredHazard(null)}
                  onClick={() => speakPhrase("weatherAlert", language, h.label)}
                  style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r="20" fill={h.color}
                    opacity={0.1 + 0.07 * Math.sin(tick * 0.15 + h.lat)} />
                  <circle cx={x} cy={y} r="12" fill={h.color} opacity={0.2} />
                  <circle cx={x} cy={y} r={isHov ? 9 : 7} fill={h.color}
                    stroke="white" strokeWidth="1.5" opacity={0.95} />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="9"
                    style={{ userSelect: "none" }}>{h.emoji}</text>
                  {isHov && (
                    <MapTooltip x={x} y={y}>
                      <div className="font-bold text-slate-800">{h.emoji} {h.label}</div>
                      <div className="text-slate-500 capitalize">{h.type.replace("_", " ")} alert</div>
                      <div className="text-slate-400">{h.lat.toFixed(1)}°N {h.lng.toFixed(1)}°E</div>
                    </MapTooltip>
                  )}
                </g>
              );
            })}

            {/* Fuel hotspot markers */}
            {FUEL_PORTS.map((fp) => {
              const { x, y } = project(fp.lat, fp.lng);
              const isHov = hoveredFuel?.name === fp.name;
              return (
                <g key={fp.name}
                  onMouseEnter={() => setHoveredFuel(fp)}
                  onMouseLeave={() => setHoveredFuel(null)}
                  onClick={() => speakPhrase("fuelAdvice", language, fp.name, fmtPrice(fp.vlsfo))}
                  style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r="11" fill={fp.color} opacity={0.2} />
                  <circle cx={x} cy={y} r={isHov ? 8 : 6} fill={fp.color}
                    stroke={fp.ring} strokeWidth="2" opacity={0.95} />
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="8"
                    fill="white" fontWeight="bold" style={{ userSelect: "none" }}>⛽</text>
                  {isHov && (
                    <MapTooltip x={x} y={y}>
                      <div className="font-bold" style={{ color: fp.color }}>⛽ {fp.name}</div>
                      <div className="text-slate-600">VLSFO: {fmtPrice(fp.vlsfo)}/MT</div>
                      <div className="text-slate-600">MGO:   {fmtPrice(fp.mgo)}/MT</div>
                      <div className="text-slate-400 text-[9px]">{fp.type} Hotspot</div>
                    </MapTooltip>
                  )}
                </g>
              );
            })}

            {/* Main port markers */}
            {MAIN_PORTS.map((p) => {
              const { x, y } = project(p.lat, p.lng);
              const isOrigin = p.name === originPort;
              const isDest   = p.name === destPort;
              const isHov    = hoveredPort === p.name;
              const col      = isOrigin ? "#0284c7" : isDest ? "#16a34a" : "#475569";
              return (
                <g key={p.name}
                  onMouseEnter={() => setHoveredPort(p.name)}
                  onMouseLeave={() => setHoveredPort(null)}
                  style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r={isOrigin || isDest ? 8 : 5}
                    fill={col} opacity={isHov ? 1 : 0.88}
                    stroke="white" strokeWidth={isOrigin || isDest ? 2 : 1} />
                  <text x={x + 10} y={y + 4} fill={col} fontSize="9.5"
                    fontFamily="sans-serif" fontWeight="700" style={{ userSelect: "none" }}>
                    {(isOrigin || isDest || isHov) ? p.name : ""}
                  </text>
                </g>
              );
            })}

            {/* ─────────────────────────────────────────────────────────────
                LAYER: AIS vessel dot (topmost — always on top of everything)
            ───────────────────────────────────────────────────────────── */}
            {layers.ais && (
              <>
                <circle cx={vesselPos.x} cy={vesselPos.y} r="10"
                  fill="none" stroke="#0284c7" strokeWidth="1.5"
                  opacity={0.3 + 0.3 * Math.sin(tick * 0.2)} />
                <circle cx={vesselPos.x} cy={vesselPos.y} r="5"
                  fill="#0284c7" stroke="white" strokeWidth="1.5" />
                <text x={vesselPos.x + 9} y={vesselPos.y - 7}
                  fill="#0369a1" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  🚢 {Math.round(vesselProgress)}%
                </text>
              </>
            )}

            {/* Fog haze overlay (when iceberg layer active + low visibility) */}
            {layers.iceberg && visibility < 60 && (
              <rect width={W} height={H}
                fill={`rgba(186,230,253,${Math.max(0, (60 - visibility) / 300)})`}
                style={{ pointerEvents: "none" }} />
            )}
          </svg>
        </div>

        {/* ── Legend bar ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-t border-sky-100 bg-sky-50/60 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-600 inline-block" /> VLSFO
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-600 inline-block" /> LSMGO
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-700 inline-block" /> HSFO
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> 🌀 Cyclone
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> 💥 HRA
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> 🌊 Swell
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-cyan-500" />
            Fishing Skiff
          </span>
          <span className="flex items-center gap-1.5"><span className="text-xs">🧊</span> Ice CRITICAL</span>
          <span className="flex items-center gap-1.5"><span className="text-xs">❄️</span> Ice Hazard</span>
          <span className="flex items-center gap-1.5"><span className="text-xs">🌊</span> Tsunami</span>
          <span className="flex items-center gap-1.5"><span className="text-xs">🗑️</span> Debris Zone</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-400/30 border border-blue-300" /> Swell Cell
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-xs">🌿</span> Eco-Zone
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="inline-block w-6 border-t-2 border-dashed border-emerald-500" />
            Ice Divert / Evasion
          </span>
          <span className="text-slate-400 italic">Click markers for voice alert</span>
        </div>
      </div>
    </>
  );
}
