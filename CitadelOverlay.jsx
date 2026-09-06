/**
 * CitadelOverlay — Web Audio API Maritime Siren + Emergency Citadel Mode
 * Sky Blue Light Theme · Anti-Piracy · War Zone · Emergency Pulsating Overlay
 *
 * Features:
 *  - Web Audio API synthesised maritime siren (multi-tone sweep)
 *  - Pulsating red/amber full-screen overlay for emergency situations
 *  - Three threat levels: PIRACY · WAR_ZONE · DRILL
 *  - Citadel protocol checklist (IMO BMP5 compliant)
 *  - Auto-mute / dismiss controls
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldAlert, X, Volume2, VolumeX, AlertTriangle, CheckCircle2, Radio } from "lucide-react";
import { speak } from "../utils/speechEngine";

// ─── Threat level configs ─────────────────────────────────────────────────────
const THREATS = {
  PIRACY: {
    id:       "PIRACY",
    label:    "Anti-Piracy Alert",
    sublabel: "BMP5 Citadel Protocol Activated",
    emoji:    "🏴‍☠️",
    color:    { overlay: "rgba(239,68,68,0.12)", border: "#ef4444", badge: "bg-rose-600", text: "text-rose-700", ring: "#ef4444" },
    siren:    { type: "piracy", freqs: [440, 880, 660, 1100], sweep: true },
    steps: [
      "Activate onboard CITADEL — secure all crew below decks",
      "Lock all external doors and hatches",
      "Cut engine and disable all external lights",
      "Activate SSAS silent distress beacon",
      "Contact UKMTO Dubai on +971 50 552 3215",
      "Do NOT engage pirates — await Naval response",
    ],
    voice: {
      en: "Piracy alert activated! All crew to citadel immediately. Lock all hatches. Activate SSAS beacon. Do not engage pirates.",
      ta: "கடல்கொள்ளை எச்சரிக்கை! அனைத்து பணியாளர்களும் உடனடியாக கோட்டைக்கு செல்லவும். அனைத்து கதவுகளையும் பூட்டவும்.",
      hi: "समुद्री डकैती चेतावनी! सभी कर्मचारी तुरंत गढ़ में जाएं। सभी हैच बंद करें। SSAS बीकन सक्रिय करें।",
    },
  },
  WAR_ZONE: {
    id:       "WAR_ZONE",
    label:    "War Zone — HRA Alert",
    sublabel: "High Risk Area · Gulf of Aden / Red Sea",
    emoji:    "💥",
    color:    { overlay: "rgba(249,115,22,0.10)", border: "#f97316", badge: "bg-orange-600", text: "text-orange-700", ring: "#f97316" },
    siren:    { type: "warzone", freqs: [220, 440, 330, 550], sweep: true },
    steps: [
      "Register voyage with UKMTO (United Kingdom Maritime Trade Operations)",
      "Ensure razor wire and water hoses are deployed on deck",
      "Man armed security team — confirm positions",
      "Increase speed to maximum safe limit",
      "Plot alternative route avoiding HRA if possible",
      "Maintain 24h bridge watch — log all contacts",
    ],
    voice: {
      en: "War zone high risk area alert. Gulf of Aden active threat corridor. Increasing speed. Armed security team to stations. UKMTO registration required.",
      ta: "உயர் ஆபத்து பகுதி எச்சரிக்கை. அடன் வளைகுடா செயல்பாட்டு அச்சுறுத்தல். வேகம் அதிகரிக்கவும்.",
      hi: "उच्च जोखिम क्षेत्र चेतावनी। अदन की खाड़ी सक्रिय खतरा गलियारा। गति बढ़ाएं। सशस्त्र सुरक्षा दल को स्टेशन पर जाएं।",
    },
  },
  DRILL: {
    id:       "DRILL",
    label:    "Emergency Drill",
    sublabel: "SOLAS Muster Station Exercise",
    emoji:    "🚨",
    color:    { overlay: "rgba(59,130,246,0.08)", border: "#3b82f6", badge: "bg-sky-600", text: "text-sky-700", ring: "#3b82f6" },
    siren:    { type: "drill", freqs: [330, 660, 495], sweep: false },
    steps: [
      "All crew to muster stations — headcount in progress",
      "Check life jackets and immersion suits",
      "Lifeboat readiness inspection",
      "Fire extinguisher locations confirmed",
      "Bridge team emergency comms check — VHF Ch.16",
      "Drill complete — return to normal duties",
    ],
    voice: {
      en: "Emergency drill commencing. All crew to muster stations. This is a drill. Confirm headcount and check safety equipment.",
      ta: "அவசர பயிற்சி தொடங்குகிறது. அனைத்து பணியாளர்களும் ஒருங்கிணைப்பு நிலையங்களுக்கு செல்லவும். இது ஒரு பயிற்சி.",
      hi: "आपातकालीन अभ्यास शुरू हो रहा है। सभी कर्मचारी मस्टर स्टेशन पर जाएं। यह एक अभ्यास है।",
    },
  },
};

// ─── Web Audio siren synthesiser ──────────────────────────────────────────────
function createSiren(audioCtxRef, threat) {
  try {
    const ctx     = new (window.AudioContext ?? window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const { freqs, sweep } = threat.siren;
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(ctx.destination);

    freqs.forEach((baseFreq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type   = i % 2 === 0 ? "sawtooth" : "sine";
      osc.frequency.value = baseFreq;

      if (sweep) {
        // Frequency sweep: low → high → low (siren wail)
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq * 2.2, now + 0.9);
        osc.frequency.linearRampToValueAtTime(baseFreq,       now + 1.8);
        osc.frequency.linearRampToValueAtTime(baseFreq * 2.2, now + 2.7);
        osc.frequency.linearRampToValueAtTime(baseFreq,       now + 3.6);
      }

      // AM envelope for pulsing effect
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5 / freqs.length, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.5 / freqs.length, ctx.currentTime + 0.8);
      gain.gain.linearRampToValueAtTime(0.1 / freqs.length, ctx.currentTime + 1.2);
      gain.gain.linearRampToValueAtTime(0.5 / freqs.length, ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      // Loop by scheduling repeated tones
      osc.stop(ctx.currentTime + 4.0);
    });

    return ctx;
  } catch {
    return null;
  }
}

// ─── Checklist item ────────────────────────────────────────────────────────────
function ChecklistItem({ text, index }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked((c) => !c)}
        className="mt-0.5 accent-rose-500 w-3.5 h-3.5 cursor-pointer shrink-0"
      />
      <span className={`text-[11px] font-mono leading-relaxed transition-all
        ${checked ? "line-through text-slate-400" : "text-slate-700 group-hover:text-slate-900"}`}>
        <span className="font-black text-slate-400 mr-1">{index + 1}.</span>
        {text}
      </span>
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CitadelOverlay({ language = "en" }) {
  const [activeThreat,  setActiveThreat]  = useState(null);
  const [sirenOn,       setSirenOn]       = useState(false);
  const [sirenLoop,     setSirenLoop]     = useState(false);
  const [pulseFrame,    setPulseFrame]    = useState(0);
  const audioCtxRef   = useRef(null);
  const sirenTimerRef = useRef(null);
  const pulseRef      = useRef(null);

  // Pulse animation
  useEffect(() => {
    if (!activeThreat) return;
    pulseRef.current = setInterval(() => setPulseFrame((f) => f + 1), 120);
    return () => clearInterval(pulseRef.current);
  }, [activeThreat]);

  const stopSiren = useCallback(() => {
    clearInterval(sirenTimerRef.current);
    try {
      audioCtxRef.current?.close();
    } catch { /* ignore */ }
    audioCtxRef.current = null;
    setSirenOn(false);
    setSirenLoop(false);
  }, []);

  const playSiren = useCallback((threat) => {
    stopSiren();
    setSirenOn(true);
    createSiren(audioCtxRef, threat);
    if (sirenLoop) {
      sirenTimerRef.current = setInterval(() => createSiren(audioCtxRef, threat), 4200);
    }
  }, [stopSiren, sirenLoop]);

  const activate = useCallback((threatKey) => {
    const threat = THREATS[threatKey];
    setActiveThreat(threat);
    // Voice announcement
    const msg = threat.voice[language] ?? threat.voice.en;
    speak(msg, language);
    // Auto-play siren
    setTimeout(() => playSiren(threat), 300);
  }, [language, playSiren]);

  const dismiss = useCallback(() => {
    stopSiren();
    setActiveThreat(null);
    setPulseFrame(0);
  }, [stopSiren]);

  const pulseOpacity = activeThreat
    ? 0.06 + 0.06 * Math.abs(Math.sin(pulseFrame * 0.18))
    : 0;

  return (
    <>
      {/* ── Full-screen pulsating overlay (when threat active) ─────────────── */}
      {activeThreat && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${activeThreat.color.overlay} 0%, transparent 70%)`,
            borderColor: activeThreat.color.border,
          }}
        >
          {/* Pulsing border ring */}
          <div
            className="absolute inset-0 border-4 rounded-none pointer-events-none transition-opacity duration-200"
            style={{
              borderColor: activeThreat.color.border,
              opacity:     pulseOpacity * 8,
            }}
          />
        </div>
      )}

      {/* ── Emergency Modal ────────────────────────────────────────────────── */}
      {activeThreat && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 bg-black/30 backdrop-blur-sm overflow-y-auto">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-4"
            style={{ borderWidth: 2, borderStyle: "solid", borderColor: activeThreat.color.border }}
          >
            {/* Header */}
            <div className={`${activeThreat.color.badge} px-5 py-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activeThreat.emoji}</span>
                  <div>
                    <p className="text-white font-black text-sm tracking-wide">{activeThreat.label}</p>
                    <p className="text-white/70 text-[10px] font-mono">{activeThreat.sublabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Siren toggle */}
                  <button
                    type="button"
                    onClick={() => sirenOn ? stopSiren() : playSiren(activeThreat)}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 cursor-pointer transition-all"
                    title={sirenOn ? "Mute Siren" : "Play Siren"}
                  >
                    {sirenOn
                      ? <VolumeX size={14} className="text-white" />
                      : <Volume2 size={14} className="text-white" />
                    }
                  </button>
                  {/* Dismiss */}
                  <button type="button" onClick={dismiss}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 cursor-pointer transition-all">
                    <X size={14} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Live indicator */}
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full animate-ping inline-block"
                  style={{ backgroundColor: activeThreat.color.border }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block -ml-4"
                  style={{ backgroundColor: activeThreat.color.border }}
                />
                <span className={`text-xs font-black font-mono ${activeThreat.color.text}`}>
                  THREAT ACTIVE — IMO Protocol Running
                </span>
                <button
                  type="button"
                  onClick={() => speak(activeThreat.voice[language] ?? activeThreat.voice.en, language)}
                  className="ml-auto p-1.5 rounded-lg border border-sky-200 hover:bg-sky-50 cursor-pointer transition-all"
                >
                  <Volume2 size={12} className="text-sky-600" />
                </button>
              </div>

              {/* Siren loop toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sirenLoop}
                  onChange={(e) => setSirenLoop(e.target.checked)}
                  className="accent-rose-500 cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-600">Loop siren continuously</span>
              </label>

              {/* IMO Checklist */}
              <div className="bg-slate-50 border border-sky-100 rounded-xl p-3.5 space-y-2.5">
                <p className="text-[10px] font-black font-mono uppercase tracking-wider text-slate-500 mb-1">
                  IMO / BMP5 Protocol Checklist
                </p>
                {activeThreat.steps.map((step, i) => (
                  <ChecklistItem key={i} text={step} index={i} />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-sky-100 bg-sky-50/60 flex gap-2">
              <button type="button" onClick={dismiss}
                className="flex-1 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-700 text-xs font-bold hover:bg-sky-50 cursor-pointer transition-all">
                Dismiss Alert
              </button>
              <button type="button"
                onClick={() => { stopSiren(); speak("All clear. Threat dismissed. Resuming normal operations.", language); setActiveThreat(null); }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 cursor-pointer transition-all flex items-center justify-center gap-1.5">
                <CheckCircle2 size={13} />
                All Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Control Panel Card (always visible) ─────────────────────────────── */}
      <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-sky-100 bg-sky-50/60">
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
            <ShieldAlert size={15} className="text-rose-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Emergency Citadel Mode</h2>
            <p className="text-[11px] font-mono text-slate-400">
              Web Audio Alarm · BMP5 Anti-Piracy · HRA War Zone Protocols
            </p>
          </div>
          {activeThreat && (
            <span className={`ml-auto flex items-center gap-1.5 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border
              ${activeThreat.color.text} bg-rose-50 border-rose-200`}>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              ACTIVE
            </span>
          )}
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Threat activation buttons */}
          <div className="grid grid-cols-3 gap-3">
            {Object.values(THREATS).map((threat) => (
              <button
                key={threat.id}
                type="button"
                onClick={() => activeThreat?.id === threat.id ? dismiss() : activate(threat.id)}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border font-mono transition-all cursor-pointer
                  ${activeThreat?.id === threat.id
                    ? `${threat.color.badge} text-white border-transparent shadow-md`
                    : "bg-white border-sky-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50"
                  }`}
              >
                <span className="text-xl">{threat.emoji}</span>
                <span className="text-[10px] font-black text-center leading-tight">
                  {threat.label.split(" ").slice(0, 2).join(" ")}
                </span>
              </button>
            ))}
          </div>

          {/* Audio status row */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 rounded-xl border border-sky-100">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
              <Radio size={12} className="text-sky-500" />
              <span>Web Audio Siren:</span>
              <span className={`font-bold ${sirenOn ? "text-rose-600" : "text-emerald-600"}`}>
                {sirenOn ? "● ACTIVE" : "○ Standby"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {sirenOn && (
                <button type="button" onClick={stopSiren}
                  className="flex items-center gap-1 text-[10px] font-bold font-mono text-rose-600 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer transition-all">
                  <VolumeX size={10} /> Mute
                </button>
              )}
              {activeThreat && (
                <button type="button" onClick={() => playSiren(activeThreat)}
                  className="flex items-center gap-1 text-[10px] font-bold font-mono text-sky-600 px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 cursor-pointer transition-all">
                  <Volume2 size={10} /> Test
                </button>
              )}
            </div>
          </div>

          {/* Threat info footer */}
          <div className="text-[10px] font-mono text-slate-400 leading-relaxed">
            Click a threat level to activate. Siren uses Web Audio API synthesised maritime tones.
            All protocols reference <span className="text-sky-600 font-bold">IMO BMP5</span> and{" "}
            <span className="text-sky-600 font-bold">STCW Chapter VI</span> standards.
          </div>
        </div>
      </div>
    </>
  );
}
