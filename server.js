import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── 1. Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── 2. MongoDB Atlas Connection / Local MongoDB Connection ──────────────────
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/navisteel";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Successfully connected to Local MongoDB"))
  .catch((err) =>
    console.warn("⚠️ Local MongoDB connection error:", err.message)
  );

// ─── Mongoose Schema & Models ────────────────────────────────────────────────
const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radiusMeters: { type: Number, default: 50 },
  createdAt: { type: Date, default: Date.now },
});

const LocationModel = mongoose.model("Location", locationSchema);

// User Schema (For Email / Password authentication check)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "Chartering Manager" },
  createdAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.model("User", userSchema);

// ─── Authentication Route (Added) ────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    // Default Demo Account Check or MongoDB Check
    if (email === "manager@navisteel.ai" && password === "admin123") {
      return res.json({
        success: true,
        token: "sample_secure_token_123",
        role: role || "Chartering Manager",
        message: "Login successful"
      });
    }

    // Checking in MongoDB Database if registered
    try {
      const user = await UserModel.findOne({ email });
      if (!user || user.password !== password) {
        return res.status(401).json({ success: false, error: "Invalid email or password." });
      }

      return res.json({
        success: true,
        token: "db_secure_token_" + user._id,
        role: user.role || role,
        message: "Login successful"
      });
    } catch (dbErr) {
      return res.status(401).json({ success: false, error: "Authentication failed." });
    }

  } catch (err) {
    res.status(500).json({ success: false, error: "Server error during login." });
  }
});

// ─── Operational & Port Data Constants ───────────────────────────────────────
const PORT_DATA = {
  Paradip: {
    waitingDays: 4.2,
    maxDraft: 17.0,
    berthCount: 8,
    congestionLevel: "HIGH",
    region: "Odisha",
    tidalRangeMeters: 2.1,
    monsoonRisk: "MODERATE",
    channelNotes: "Siltation active in approach channel; maintain safe Under Keel Clearance (UKC).",
    contactVHF: "Channel 16 / 11",
  },
  Visakhapatnam: {
    waitingDays: 1.1,
    maxDraft: 16.5,
    berthCount: 12,
    congestionLevel: "LOW",
    region: "Andhra Pradesh",
    tidalRangeMeters: 1.5,
    monsoonRisk: "LOW",
    channelNotes: "Deep inner harbor. Turnaround times optimal.",
    contactVHF: "Channel 16 / 12",
  },
  Haldia: {
    waitingDays: 6.8,
    maxDraft: 8.5,
    berthCount: 6,
    congestionLevel: "CRITICAL",
    region: "West Bengal",
    tidalRangeMeters: 4.8,
    monsoonRisk: "HIGH",
    channelNotes: "Strict draft restriction. Lightering or tidal window navigation required.",
    contactVHF: "Channel 16 / 14",
  },
};

const BASE_RATES = {
  Paradip: 27.4,
  Visakhapatnam: 26.8,
  Haldia: 28.1,
};

const predefinedFleet = [
  { id: 1, vesselName: "MV Ocean Titan", tonnage: 75000, port: "Gangavaram", status: "Active", freightRate: 28.50 },
  { id: 2, vesselName: "MV Steel Pioneer", tonnage: 82000, port: "Paradip", status: "Loading", freightRate: 27.90 },
  { id: 3, vesselName: "MV Blue Horizon", tonnage: 68000, port: "Haldia", status: "Waiting", freightRate: 29.10 },
  { id: 4, vesselName: "MV Eastern Star", tonnage: 79000, port: "Visakhapatnam", status: "Active", freightRate: 28.20 }
];

const USD_TO_INR = 83.5;

function usdToInr(usd) {
  return Math.round(usd * USD_TO_INR);
}

function formatInr(amount) {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function buildFreightSeries(baseRate, volatility, historicalCount = 22) {
  const startDate = new Date("2026-08-01");
  const series = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i * 2);
    const label = date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    const drift = (Math.random() - 0.48) * volatility;
    const rate = parseFloat((baseRate + drift).toFixed(2));

    if (i < historicalCount) {
      series.push({ day: label, actual: rate, forecast: null });
    } else {
      const forecastRate = parseFloat(
        (baseRate + (i - historicalCount) * 0.12 + (Math.random() - 0.45) * volatility).toFixed(2)
      );
      series.push({ day: label, actual: null, forecast: forecastRate });
    }
  }

  return series;
}

// ─── 4. GPS Location Routes ───────────────────────────────────────────────────

app.post("/api/locations", async (req, res) => {
  try {
    const { name, latitude, longitude, radiusMeters } = req.body;

    const locName = name || req.body.locationName || "Custom GPS Site";
    const lat = latitude != null ? Number(latitude) : 13.08;
    const lng = longitude != null ? Number(longitude) : 80.27;

    try {
      const newLocation = await LocationModel.create({
        name: locName,
        latitude: lat,
        longitude: lng,
        radiusMeters: Number(radiusMeters) || 50,
      });
      return res.status(201).json({ success: true, message: "Location saved to DB.", location: newLocation });
    } catch (dbErr) {
      return res.status(201).json({ 
        success: true, 
        message: "Location handled in offline fallback mode.", 
        location: { name: locName, latitude: lat, longitude: lng } 
      });
    }
  } catch (err) {
    res.status(200).json({ success: true, message: "Handled successfully." });
  }
});

// ─── 5. Freight Forecast Route ───────────────────────────────────────────────
app.get("/api/forecast", (req, res) => {
  try {
    const routes = Object.entries(BASE_RATES).map(([port, baseRate]) => ({
      route: `Australia → ${port}`,
      port,
      baseRateUsdPerMt: baseRate,
      series: buildFreightSeries(baseRate, 1.4),
    }));

    const portAlerts = Object.entries(PORT_DATA).map(([port, data]) => ({
      port,
      waitingDays: data.waitingDays,
      congestionLevel: data.congestionLevel,
      maxDraftMetres: data.maxDraft,
      region: data.region,
      monsoonRisk: data.monsoonRisk,
      channelNotes: data.channelNotes,
      contactVHF: data.contactVHF,
    }));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      market: {
        spotFreightRateUsdPerMt: 27.4,
        bunkerFuelVlsfoUsdPerMt: 642.5,
        demurrageCostUsdPerDay: 18_500,
        modelAccuracyPct: 96.8,
        baseCurrency: "USD",
        inrExchangeRate: USD_TO_INR,
      },
      routes,
      portAlerts,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to generate forecast data." });
  }
});

// Fleet API Endpoint
app.get('/api/fleet', (req, res) => {
  res.json(predefinedFleet);
});

// ─── 6. Charter Optimization Engine Route ────────────────────────────────────
app.post("/api/optimize-charter", async (req, res) => {
  try {
    const { tonnage, port, laycanDate } = req.body;
    if (!tonnage || !port || !laycanDate) {
      return res.status(400).json({ success: false, error: "Missing required fields." });
    }

    const parsedTonnage = Number(tonnage);

    const portInfo = PORT_DATA[port] || {
      waitingDays: 1.5,
      maxDraft: 14.0,
      berthCount: 5,
      congestionLevel: "LOW",
      region: "Custom GPS Site",
      contactVHF: "Channel 16",
    };

    const baseRateUsd = BASE_RATES[port] ?? 27.4;
    const totalFreightUsd = baseRateUsd * parsedTonnage;

    const isCritical = portInfo.congestionLevel === "CRITICAL";
    const savingsUsd = totalFreightUsd * (isCritical ? 0.065 : 0.055);
    const savingsInr = usdToInr(savingsUsd);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      recommendation: isCritical ? "SPOT_CHARTER" : "TIME_CHARTER",
      confidencePct: isCritical ? 88.5 : 93.2,
      rationale: `Optimization tailored for ${port}. Delay risk is currently ${portInfo.congestionLevel.toLowerCase()}.`,
      warnings: portInfo.maxDraft < 10 ? [`Strict draft limit of ${portInfo.maxDraft}m at ${port}.`] : [],
      portInfo,
      savings: {
        estimatedUsd: parseFloat(savingsUsd.toFixed(2)),
        estimatedInr: savingsInr,
        estimatedInrFormatted: formatInr(savingsInr),
      },
      freightEstimate: {
        totalFreightUsd: parseFloat(totalFreightUsd.toFixed(2)),
        totalFreightInrFormatted: formatInr(usdToInr(totalFreightUsd)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Optimization engine error." });
  }
});

// ─── 7. Sailor Draft & Navigation Assessment Route ───────────────────────────
app.post("/api/sailor-tools/draft-check", (req, res) => {
  try {
    const { vesselDraft, port, tideHeightMeters = 0, safetyMarginMeters = 1.0 } = req.body;

    const parsedDraft = Number(vesselDraft);
    const parsedTide = Number(tideHeightMeters);
    const parsedMargin = Number(safetyMarginMeters);

    if (isNaN(parsedDraft)) {
      return res.status(400).json({ success: false, error: "Invalid vessel draft value." });
    }

    const portInfo = PORT_DATA[port] || {
      maxDraft: 12.0,
      contactVHF: "Channel 16",
      channelNotes: "Custom location — execute standard echo sounder monitoring.",
    };

    const maxPermissibleDraft = portInfo.maxDraft + parsedTide - parsedMargin;
    const takesGround = parsedDraft > maxPermissibleDraft;
    const clearanceMeters = parseFloat((maxPermissibleDraft - parsedDraft).toFixed(2));

    let status = "SAFE";
    let recommendation = "Proceed with standard approach.";

    if (takesGround) {
      status = "CRITICAL_HAZARD";
      recommendation = `Vessel draft (${parsedDraft}m) exceeds limit. Perform offshore lightering or wait for higher tide window.`;
    } else if (clearanceMeters < 0.8) {
      status = "WARNING_LOW_MARGIN";
      recommendation = "Low Under-Keel Clearance (UKC). Slow speed recommended to reduce vessel squat.";
    }

    res.json({
      success: true,
      port,
      vesselDraft: parsedDraft,
      maxPortDraft: portInfo.maxDraft,
      tideAdded: parsedTide,
      safetyMargin: parsedMargin,
      effectiveClearanceMeters: clearanceMeters,
      status,
      recommendation,
      vhfChannel: portInfo.contactVHF,
      channelNotes: portInfo.channelNotes,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Draft check computation failed." });
  }
});

// ─── 8. Health Check ────────────────────────────────2──────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`⚓ NAVI-STEEL AI Server running on http://localhost:${PORT}`);
});