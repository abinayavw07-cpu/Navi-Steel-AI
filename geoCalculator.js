/**
 * NAVI-STEEL AI — Geo-Navigation Calculator
 * Great-circle distance, ETA, fuel consumption, CII rating
 */

const R_KM  = 6371;    // Earth radius km
const KM_TO_NM = 0.539957;

// ─── Distance ─────────────────────────────────────────────────────────────────

/** Convert degrees to radians */
function toRad(deg) { return (deg * Math.PI) / 180; }

/**
 * Haversine great-circle distance between two coordinates.
 * @returns {{ km: number, nm: number }}
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c  = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R_KM * c;
  return { km: parseFloat(km.toFixed(1)), nm: parseFloat((km * KM_TO_NM).toFixed(1)) };
}

// ─── ETA ──────────────────────────────────────────────────────────────────────

/**
 * Calculate ETA given distance (NM) and speed (knots).
 * @returns {{ hours: number, days: number, eta: string }} ISO date string
 */
export function calcETA(distanceNm, speedKnots = 12) {
  if (!speedKnots || speedKnots <= 0) return { hours: 0, days: 0, eta: "—" };
  const hours = distanceNm / speedKnots;
  const days  = hours / 24;
  const etaDate = new Date(Date.now() + hours * 3600 * 1000);
  return {
    hours:  parseFloat(hours.toFixed(1)),
    days:   parseFloat(days.toFixed(1)),
    eta:    etaDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  };
}

// ─── Fuel Consumption ─────────────────────────────────────────────────────────

/**
 * Estimate VLSFO fuel consumption for a voyage.
 * Typical Capesize burns ~42–55 MT/day at sea speed.
 * @param {number} distanceNm
 * @param {number} speedKnots
 * @param {number} consumptionPerDay - MT/day (default 48)
 * @returns {{ totalMt: number, costUsd: number }}
 */
export function estimateFuelConsumption(distanceNm, speedKnots = 12, consumptionPerDay = 48, vlsfoPriceUsdPerMt = 620) {
  const { days } = calcETA(distanceNm, speedKnots);
  const totalMt  = parseFloat((days * consumptionPerDay).toFixed(1));
  const costUsd  = parseFloat((totalMt * vlsfoPriceUsdPerMt).toFixed(2));
  return { totalMt, costUsd };
}

// ─── Waypoint Progress ────────────────────────────────────────────────────────

/**
 * Returns a waypoint progress percentage (0–100) given current position
 * relative to the start → end route line.
 */
export function routeProgress(startLat, startLng, endLat, endLng, curLat, curLng) {
  const total   = haversineDistance(startLat, startLng, endLat, endLng).nm;
  const covered = haversineDistance(startLat, startLng, curLat, curLng).nm;
  return Math.min(100, parseFloat(((covered / total) * 100).toFixed(1)));
}

// ─── Interpolate midpoints for SVG route line ─────────────────────────────────

/**
 * Returns n evenly-spaced { lat, lng } points along the great-circle route.
 */
export function interpolateRoute(lat1, lng1, lat2, lng2, steps = 8) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      lat: lat1 + (lat2 - lat1) * t,
      lng: lng1 + (lng2 - lng1) * t,
    });
  }
  return points;
}

// ─── CII (Carbon Intensity Indicator) ─────────────────────────────────────────

/**
 * Estimate CII rating (A–E) for a voyage.
 * Formula simplified from IMO MEPC.352(78).
 * @param {number} fuelConsumedMt
 * @param {number} distanceNm
 * @param {number} dwtTonnage
 * @returns {{ cii: number, rating: "A"|"B"|"C"|"D"|"E", label: string, color: string }}
 */
export function calcCII(fuelConsumedMt, distanceNm, dwtTonnage) {
  if (!distanceNm || !dwtTonnage) return { cii: 0, rating: "C", label: "Average", color: "#f59e0b" };

  // CO2 conversion factor for VLSFO = 3.151 MT CO2 per MT fuel
  const co2Mt  = fuelConsumedMt * 3.151;
  // Attained CII = CO2 (g) / (DWT * Distance)
  const cii    = parseFloat(((co2Mt * 1_000_000) / (dwtTonnage * distanceNm)).toFixed(4));

  // Reference thresholds (generic Capesize approximation)
  let rating, label, color;
  if      (cii < 3.0)  { rating = "A"; label = "Superior";    color = "#22c55e"; }
  else if (cii < 4.0)  { rating = "B"; label = "Good";        color = "#84cc16"; }
  else if (cii < 5.5)  { rating = "C"; label = "Moderate";    color = "#f59e0b"; }
  else if (cii < 7.0)  { rating = "D"; label = "Minor Deficiency"; color = "#f97316"; }
  else                 { rating = "E"; label = "Significant Deficiency"; color = "#ef4444"; }

  return { cii, rating, label, color };
}

// ─── EEXI Power Limit Check ───────────────────────────────────────────────────

/**
 * Returns whether a vessel's installed power exceeds EEXI limit.
 * @param {number} installedPowerKw
 * @param {number} dwtTonnage
 * @returns {{ compliant: boolean, margin: number }}
 */
export function eeximCheck(installedPowerKw, dwtTonnage) {
  // Simplified EEXI reference: 3.0 W/tonne for Capesize
  const limitKw   = dwtTonnage * 3.0;
  const compliant = installedPowerKw <= limitKw;
  const margin    = parseFloat(((limitKw - installedPowerKw) / limitKw * 100).toFixed(1));
  return { compliant, margin, limitKw };
}

// ─── Port constants ───────────────────────────────────────────────────────────

export const PORT_COORDS = {
  Paradip:         { lat: 20.262,  lng: 86.663  },
  Visakhapatnam:   { lat: 17.687,  lng: 83.219  },
  Haldia:          { lat: 22.026,  lng: 88.085  },
  Chennai:         { lat: 13.083,  lng: 80.271  },
  Mumbai:          { lat: 18.922,  lng: 72.835  },
  Fujairah:        { lat: 25.122,  lng: 56.336  },
  Singapore:       { lat: 1.290,   lng: 103.850 },
  Colombo:         { lat: 6.927,   lng: 79.861  },
  PortKlang:       { lat: 2.988,   lng: 101.366 },
  Newcastle:       { lat: -32.927, lng: 151.776 },
  Gladstone:       { lat: -23.841, lng: 151.258 },
};
