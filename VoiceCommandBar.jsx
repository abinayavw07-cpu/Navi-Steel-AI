/**
 * VoiceCommandBar — Web Speech Recognition Command Engine
 * Sky Blue Light Theme · White card · sky-200 borders
 *
 * Supports: English (en-US) · Tamil (ta-IN) · Hindi (hi-IN)
 * Commands recognised:
 *   "Run Density Scan"  → triggers density scan callback
 *   "Switch Map"        → switches to GeoNav tab (tab index 2)
 *   "Lock Valve"        → triggers valve lock callback
 *   "Show Weather"      → triggers weather panel callback
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, CheckCircle2, AlertTriangle, X, Radio } from "lucide-react";
import { speak } from "../utils/speechEngine";

// ─── Command definitions per language ────────────────────────────────────────
const COMMANDS = {
  en: [
    {
      id: "density_scan",
      patterns: ["run density scan", "density scan", "scan density", "hull scan"],
      label: "Run Density Scan",
      description: "Initiates hull density sonar scan",
      icon: "🔬",
      color: "text-violet-700",
      bg: "bg-violet-50 border-violet-200",
    },
    {
      id: "switch_map",
      patterns: ["switch map", "open map", "show map", "geonav", "tactical map", "radar map"],
      label: "Switch Map",
      description: "Opens GeoNav Tactical Radar",
      icon: "🗺️",
      color: "text-sky-700",
      bg: "bg-sky-50 border-sky-200",
    },
    {
      id: "lock_valve",
      patterns: ["lock valve", "valve lock", "close valve", "seal valve", "emergency valve"],
      label: "Lock Valve",
      description: "Engages emergency ballast valve lock",
      icon: "🔒",
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
    },
    {
      id: "show_weather",
      patterns: ["show weather", "weather report", "weather status", "cyclone status", "weather alert"],
      label: "Show Weather",
      description: "Displays live weather & cyclone overlay",
      icon: "🌦️",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
    },
  ],
  ta: [
    {
      id: "density_scan",
      patterns: ["அடர்த்தி ஸ்கேன்", "ஸ்கேன் செய்", "கப்பல் ஸ்கேன்"],
      label: "அடர்த்தி ஸ்கேன்",
      description: "கப்பல் அடர்த்தி ஸ்கேன் தொடங்கு",
      icon: "🔬",
      color: "text-violet-700",
      bg: "bg-violet-50 border-violet-200",
    },
    {
      id: "switch_map",
      patterns: ["வரைபடம் காட்டு", "வரைபடம் மாற்று", "ரேடார் திற"],
      label: "வரைபடம் மாற்று",
      description: "GeoNav ரேடார் திற",
      icon: "🗺️",
      color: "text-sky-700",
      bg: "bg-sky-50 border-sky-200",
    },
    {
      id: "lock_valve",
      patterns: ["வால்வு பூட்டு", "அவசர வால்வு", "வால்வு மூடு"],
      label: "வால்வு பூட்டு",
      description: "அவசர பாலஸ்ட் வால்வு பூட்டு",
      icon: "🔒",
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
    },
    {
      id: "show_weather",
      patterns: ["வானிலை காட்டு", "புயல் நிலை", "வானிலை அறிக்கை"],
      label: "வானிலை காட்டு",
      description: "நேரடி வானிலை அறிக்கை",
      icon: "🌦️",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
    },
  ],
  hi: [
    {
      id: "density_scan",
      patterns: ["घनत्व स्कैन", "स्कैन करो", "जहाज स्कैन"],
      label: "घनत्व स्कैन",
      description: "पोत घनत्व सोनार स्कैन शुरू करें",
      icon: "🔬",
      color: "text-violet-700",
      bg: "bg-violet-50 border-violet-200",
    },
    {
      id: "switch_map",
      patterns: ["मानचित्र दिखाओ", "नक्शा बदलो", "रडार खोलो", "मैप स्विच"],
      label: "नक्शा बदलें",
      description: "GeoNav रडार खोलें",
      icon: "🗺️",
      color: "text-sky-700",
      bg: "bg-sky-50 border-sky-200",
    },
    {
      id: "lock_valve",
      patterns: ["वाल्व बंद करो", "आपातकालीन वाल्व", "वाल्व लॉक"],
      label: "वाल्व लॉक",
      description: "आपातकालीन बैलेस्ट वाल्व लॉक",
      icon: "🔒",
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
    },
    {
      id: "show_weather",
      patterns: ["मौसम दिखाओ", "तूफान स्थिति", "मौसम रिपोर्ट"],
      label: "मौसम दिखाएं",
      description: "लाइव मौसम रिपोर्ट",
      icon: "🌦️",
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
    },
  ],
};

const LANG_CODE = { en: "en-US", ta: "ta-IN", hi: "hi-IN" };
const LANG_LABEL = { en: "English", ta: "Tamil · தமிழ்", hi: "Hindi · हिन्दी" };

// ─── Response phrases per command per language ────────────────────────────────
const RESPONSES = {
  en: {
    density_scan: "Hull density scan initiated. Sonar array active. Checking for contraband and structural anomalies.",
    switch_map:   "Switching to GeoNav Tactical Radar. Live AIS overlay loading.",
    lock_valve:   "Emergency ballast valve lock engaged. All discharge ports sealed. Captain notified.",
    show_weather: "Loading live weather overlay. Cyclone watch and swell data streaming now.",
  },
  ta: {
    density_scan: "கப்பல் அடர்த்தி ஸ்கேன் தொடங்கப்பட்டது. சோனார் செயல்படுகிறது.",
    switch_map:   "GeoNav ரேடார் திறக்கப்படுகிறது. நேரடி AIS தரவு ஏற்றப்படுகிறது.",
    lock_valve:   "அவசர பாலஸ்ட் வால்வு பூட்டப்பட்டது. அனைத்து கதவுகளும் மூடப்பட்டன.",
    show_weather: "நேரடி வானிலை தரவு ஏற்றப்படுகிறது. புயல் கண்காணிப்பு செயல்படுகிறது.",
  },
  hi: {
    density_scan: "पोत घनत्व स्कैन शुरू हो गया। सोनार सरणी सक्रिय है।",
    switch_map:   "GeoNav रडार खुल रहा है। लाइव AIS डेटा लोड हो रहा है।",
    lock_valve:   "आपातकालीन बैलेस्ट वाल्व लॉक हो गया। सभी बंदरगाह सील कर दिए गए।",
    show_weather: "लाइव मौसम डेटा लोड हो रहा है। चक्रवात निगरानी सक्रिय है।",
  },
};

// ─── Match transcript to a command ───────────────────────────────────────────
function matchCommand(transcript, lang) {
  const lower = transcript.toLowerCase().trim();
  const cmds  = COMMANDS[lang] ?? COMMANDS.en;
  for (const cmd of cmds) {
    if (cmd.patterns.some((p) => lower.includes(p))) return cmd;
  }
  // Also try English fallback patterns regardless of lang
  for (const cmd of COMMANDS.en) {
    if (cmd.patterns.some((p) => lower.includes(p))) return cmd;
  }
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VoiceCommandBar({ language = "en", onSwitchMap, onDensityScan, onLockValve, onShowWeather }) {
  const [isListening,   setIsListening]   = useState(false);
  const [transcript,    setTranscript]    = useState("");
  const [lastCommand,   setLastCommand]   = useState(null);
  const [history,       setHistory]       = useState([]);
  const [voiceLang,     setVoiceLang]     = useState(language);
  const [error,         setError]         = useState("");
  const [expanded,      setExpanded]      = useState(false);
  const recognitionRef = useRef(null);

  // Supported check
  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const fireCallback = useCallback((cmdId) => {
    if (cmdId === "density_scan" && onDensityScan) onDensityScan();
    if (cmdId === "switch_map"   && onSwitchMap)   onSwitchMap();
    if (cmdId === "lock_valve"   && onLockValve)   onLockValve();
    if (cmdId === "show_weather" && onShowWeather) onShowWeather();
  }, [onDensityScan, onSwitchMap, onLockValve, onShowWeather]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) { setError("Web Speech API not supported in this browser."); return; }
    setError("");
    setTranscript("");

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang          = LANG_CODE[voiceLang] ?? "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 2;
    rec.continuous    = false;
    recognitionRef.current = rec;

    rec.onstart = () => setIsListening(true);
    rec.onend   = () => setIsListening(false);
    rec.onerror = (e) => {
      setIsListening(false);
      if (e.error === "no-speech") setError("No speech detected. Try again.");
      else if (e.error === "not-allowed") setError("Microphone permission denied.");
      else setError(`Speech error: ${e.error}`);
    };

    rec.onresult = (e) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += txt;
        else interim += txt;
      }
      const displayed = final || interim;
      setTranscript(displayed);

      if (final) {
        const cmd = matchCommand(final, voiceLang);
        const entry = {
          id:   Date.now(),
          text: final,
          cmd:  cmd ?? null,
          ts:   new Date().toLocaleTimeString(),
        };
        setLastCommand(cmd);
        setHistory((h) => [entry, ...h].slice(0, 8));

        if (cmd) {
          speak(RESPONSES[voiceLang]?.[cmd.id] ?? RESPONSES.en[cmd.id], voiceLang);
          fireCallback(cmd.id);
        } else {
          speak(`Command not recognised: ${final}`, voiceLang);
        }
      }
    };

    rec.start();
  }, [isSupported, voiceLang, fireCallback]);

  // Sync lang prop changes
  useEffect(() => { setVoiceLang(language); }, [language]);

  // Cleanup on unmount
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return (
    <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-sky-100 bg-sky-50/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 rounded-xl">
            <Radio size={15} className="text-sky-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Voice Command Engine</h2>
            <p className="text-[11px] font-mono text-slate-400">
              Web Speech Recognition · Maritime Commands · {LANG_LABEL[voiceLang]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value)}
            className="text-[10px] font-bold font-mono bg-white border border-sky-200 rounded-lg px-2 py-1 text-sky-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/40"
          >
            <option value="en">EN</option>
            <option value="ta">TA</option>
            <option value="hi">HI</option>
          </select>

          <button type="button" onClick={() => setExpanded((x) => !x)}
            className="p-1.5 rounded-lg hover:bg-sky-100 border border-sky-200 cursor-pointer transition-all">
            {expanded
              ? <X size={12} className="text-slate-400" />
              : <span className="text-[9px] font-black font-mono text-sky-600">CMDS</span>}
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* ── Mic Button + Status ──────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={!isSupported}
            className={`relative flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm
              ${isListening
                ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-300/40 shadow-md"
                : "bg-sky-500 text-white hover:bg-sky-600 shadow-sky-300/40"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isListening ? (
              <>
                <MicOff size={16} />
                Stop Listening
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-400 rounded-full border-2 border-white animate-ping" />
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white" />
              </>
            ) : (
              <>
                <Mic size={16} />
                Start Listening
              </>
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Live transcript */}
            <div className={`text-sm font-mono rounded-xl px-3.5 py-2.5 border min-h-[40px] transition-all
              ${isListening
                ? "bg-sky-50 border-sky-300 text-sky-800 animate-pulse"
                : "bg-slate-50 border-sky-100 text-slate-500"
              }`}>
              {transcript
                ? <span className="text-slate-800 font-semibold">&ldquo;{transcript}&rdquo;</span>
                : <span className="text-slate-400 text-xs italic">
                    {isListening ? "Listening…" : "Press mic and speak a command"}
                  </span>
              }
            </div>
            {error && (
              <p className="text-[10px] font-mono text-rose-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={10} /> {error}
              </p>
            )}
          </div>
        </div>

        {/* ── Last Recognised Command ──────────────────────────────────────── */}
        {lastCommand && (
          <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${lastCommand.bg}`}>
            <span className="text-xl">{lastCommand.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold font-mono ${lastCommand.color}`}>
                ✓ COMMAND EXECUTED: {lastCommand.label}
              </p>
              <p className="text-[10px] font-mono text-slate-500 truncate">{lastCommand.description}</p>
            </div>
            <button type="button" onClick={() => setLastCommand(null)}
              className="p-1 rounded hover:bg-black/5 cursor-pointer transition-all shrink-0">
              <X size={11} className="text-slate-400" />
            </button>
          </div>
        )}

        {/* ── Command Reference (expandable) ──────────────────────────────── */}
        {expanded && (
          <div className="border border-sky-100 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-sky-50 border-b border-sky-100">
              <p className="text-[10px] font-black font-mono uppercase tracking-wider text-sky-700">
                Available Commands — {LANG_LABEL[voiceLang]}
              </p>
            </div>
            <div className="divide-y divide-sky-50">
              {(COMMANDS[voiceLang] ?? COMMANDS.en).map((cmd) => (
                <div key={cmd.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="text-base shrink-0">{cmd.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold font-mono ${cmd.color}`}>{cmd.label}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{cmd.description}</p>
                  </div>
                  <div className="shrink-0 flex flex-wrap gap-1 max-w-[180px] justify-end">
                    {cmd.patterns.slice(0, 2).map((p) => (
                      <span key={p} className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        &ldquo;{p}&rdquo;
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── History ─────────────────────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-black font-mono uppercase tracking-wider text-slate-400">
              Command History
            </p>
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <span className="text-slate-300">{h.ts}</span>
                <span className="text-slate-400">&ldquo;{h.text}&rdquo;</span>
                {h.cmd
                  ? <span className={`ml-auto font-bold ${h.cmd.color} flex items-center gap-1`}>
                      <CheckCircle2 size={9} /> {h.cmd.label}
                    </span>
                  : <span className="ml-auto text-rose-400 flex items-center gap-1">
                      <AlertTriangle size={9} /> Unknown
                    </span>
                }
              </div>
            ))}
          </div>
        )}

        {/* ── Unsupported fallback ─────────────────────────────────────────── */}
        {!isSupported && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs font-mono text-amber-800">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} /> Web Speech API not available
            </p>
            <p className="text-amber-700">
              Use Chrome or Edge for voice commands. Firefox and Safari have limited support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
