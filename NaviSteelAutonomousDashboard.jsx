import React, { useState, useEffect } from 'react';

// Pre-cached Multi-Lingual Voice Dictionary for Offline Engine
const VOICE_DICTIONARY = {
  ta: {
    welcome: "வணக்கம் மாலுமி! நவி-ஸ்டீல் AI தங்களை வரவேற்கிறது. நான் உங்களின் குரல் வழி உதவியாளர்.",
    sosAlert: "எச்சரிக்கை! இன்ஜின் உருளையில் அதிக வெப்பம் கண்டறியப்பட்டுள்ளது. VHF சேனல் 16 இயக்கப்பட்டது.",
    piracyAlert: "ஆபத்து! கடற் கொள்ளையர்கள் அணுகுகிறார்கள். சிட்டாடல் அறை பூட்டப்பட்டது.",
    smugglingAlert: "எச்சரிக்கை! கார்கோ 409-ல் அடர்த்தி வேறுபாடு உள்ளது. கடலோரக் காவல்படைக்குத் தகவல் அனுப்பப்பட்டது."
  },
  en: {
    welcome: "Welcome Mariner! Navi-Steel AI online. I am your autonomous voice assistant.",
    sosAlert: "Critical Alert! Cylinder overheating detected. VHF Channel 16 engaged.",
    piracyAlert: "Piracy Danger! Fast craft approaching. Citadel auto-lock activated.",
    smugglingAlert: "Contraband Warning! High density mismatch in Cargo 409. Coast Guard notified."
  },
  hi: {
    welcome: "नमस्ते नाविक! नवी-स्टील एआई में आपका स्वागत है। मैं आपका वॉइस असिस्टेंट हूँ।",
    sosAlert: "चेतावनी! इंजन अधिक गर्म हो गया है। वीएचएफ चैनल 16 चालू है।",
    piracyAlert: "खतरा! समुद्री डाकू पास आ रहे हैं। सिटाडेल लॉक सक्रिय है।",
    smugglingAlert: "चेतावनी! कार्गो 409 में संदिग्ध घनत्व मिला है। तट रक्षक को सूचित किया गया।"
  }
};

export default function NaviSteelAutonomousDashboard() {
  // App States
  const [selectedLang, setSelectedLang] = useState('ta');
  const [isOnline, setIsOnline] = useState(false);
  const [vibeVal, setVibeVal] = useState(1.4);
  const [activeAlert, setActiveAlert] = useState(null);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [aiSpeechLog, setAiSpeechLog] = useState('');

  // 1. Multi-Lingual Speech Synthesis Engine
  const speakAI = (text, langCode) => {
    setAiSpeechLog(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode === 'ta' ? 'ta-IN' : langCode === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initial Voice Welcome
  useEffect(() => {
    speakAI(VOICE_DICTIONARY[selectedLang].welcome, selectedLang);
  }, [selectedLang]);

  // 2. Anomaly Simulations
  const triggerEngineSOS = () => {
    setActiveAlert('SOS');
    speakAI(VOICE_DICTIONARY[selectedLang].sosAlert, selectedLang);
  };

  const triggerPiracyDefense = () => {
    setActiveAlert('PIRACY');
    speakAI(VOICE_DICTIONARY[selectedLang].piracyAlert, selectedLang);
  };

  const triggerSmugglingCheck = () => {
    setActiveAlert('SMUGGLING');
    speakAI(VOICE_DICTIONARY[selectedLang].smugglingAlert, selectedLang);
  };

  const resetSystem = () => {
    setActiveAlert(null);
    setVibeVal(1.4);
    speakAI(selectedLang === 'ta' ? "அமைப்புகள் அனைத்தும் சீரமைக்கப்பட்டன." : "All systems nominal.", selectedLang);
  };

  // 3. Dynamic Voice/Text Query Handler
  const handleUserQuerySubmit = (e) => {
    e.preventDefault();
    if (!voiceQuery) return;
    
    let reply = "";
    const q = voiceQuery.toLowerCase();
    
    if (q.includes('fuel') || q.includes('எரிபொருள்')) {
      reply = selectedLang === 'ta' ? "தூத்துக்குடி துறைமுகத்தில் VLSFO எரிபொருள் மிகக் குறைந்த விலையில் ($610/T) கிடைக்கிறது." : "V.O.C Tuticorin port has the lowest VLSFO rate at $610/T.";
    } else if (q.includes('weather') || q.includes('புயல்')) {
      reply = selectedLang === 'ta' ? "முன்னோக்கி 40 knots வேகத்தில் காற்று வீசுகிறது. வேகத்தை 10 knots ஆகக் குறைக்கவும்." : "Storm wind detected at 40 knots. Reduce speed to 10 knots.";
    } else {
      reply = selectedLang === 'ta' ? `கேள்வி பெறப்பட்டது: "${voiceQuery}". ஆஃப்லைன் AI ஆய்வில் உள்ளது.` : `Query received: "${voiceQuery}". Edge AI processing.`;
    }
    
    speakAI(reply, selectedLang);
    setVoiceQuery('');
  };

  return (
    <div style={{ background: '#030712', color: '#f3f4f6', minHeight: '100vh', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', padding: '16px 24px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #1f2937' }}>
        <div>
          <h1 style={{ margin: 0, color: '#38bdf8', fontSize: '22px' }}>🚢 NAVI-STEEL AI: Autonomous Maritime Command</h1>
          <small style={{ color: '#9ca3af' }}>Multi-Lingual Voice Copilot & Real-Time Maritime Defense Suite</small>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Multi-Language Selector */}
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value)}
            style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
            <option value="en">🇺🇸 English</option>
            <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
          </select>

          {/* Online/Offline Toggle */}
          <button 
            onClick={() => setIsOnline(!isOnline)}
            style={{ background: isOnline ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isOnline ? '🌐 ONLINE CLOUD' : '📡 OFFLINE EDGE AI'}
          </button>
        </div>
      </div>

      {/* ACTIVE CRITICAL ALERT BANNER */}
      {activeAlert && (
        <div style={{ background: activeAlert === 'SOS' ? '#7f1d1d' : activeAlert === 'PIRACY' ? '#7c2d12' : '#701a75', padding: '16px 24px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px solid #ef4444', animation: 'pulse 1s infinite' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fca5a5' }}>
              {activeAlert === 'SOS' && '🚨 CRITICAL ENGINE FAILURE DETECTED'}
              {activeAlert === 'PIRACY' && '⚔️ PIRACY APPROACH DETECTED - CITADEL ENGAGED'}
              {activeAlert === 'SMUGGLING' && '📦 UNLAWFUL CONTRABAND & DENSITY MISMATCH'}
            </h3>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>{aiSpeechLog}</div>
          </div>
          <button onClick={resetSystem} style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Dismiss Alert
          </button>
        </div>
      )}

      {/* DYNAMIC DASHBOARD GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* PANEL 1: MULTI-LINGUAL VOICE COPILOT */}
        <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#38bdf8' }}>🎙️ Interactive Voice & Text AI Copilot</h3>
          <div style={{ background: '#030712', padding: '12px', borderRadius: '8px', minHeight: '80px', marginBottom: '16px', border: '1px solid #374151', fontSize: '14px', color: '#4ade80' }}>
            <strong>AI Voice Output:</strong> {aiSpeechLog || "Standing by for navigator input..."}
          </div>

          <form onSubmit={handleUserQuerySubmit} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder={selectedLang === 'ta' ? "கேள்வியைக் கேட்கவும் (எ.கா. Fuel, Storm)..." : "Ask AI anything..."} 
              value={voiceQuery}
              onChange={(e) => setVoiceQuery(e.target.value)}
              style={{ flex: 1, background: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '10px', borderRadius: '6px' }}
            />
            <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Ask
            </button>
          </form>
        </div>

        {/* PANEL 2: COLOR-CODED FUEL HOTSPOTS */}
        <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#38bdf8' }}>⛽ Color-Coded Bunker Fuel Index</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
            <div style={{ background: '#064e3b', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #22c55e' }}>
              <strong>🟢 VLSFO (Eco Green)</strong><br/>Tuticorin: $610/T
            </div>
            <div style={{ background: '#1e3a8a', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
              <strong>🔵 LSMGO (Clean Blue)</strong><br/>Chennai: $890/T
            </div>
            <div style={{ background: '#7f1d1d', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #ef4444' }}>
              <strong>🔴 HSFO (High Sulphur)</strong><br/>Mumbai: $490/T
            </div>
            <div style={{ background: '#713f12', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #eab308' }}>
              <strong>🟡 DIESEL (Marine)</strong><br/>Vizag: $1.10/L
            </div>
          </div>
        </div>

        {/* PANEL 3: ANOMALY SIMULATION & DEFENSE CONTROLS */}
        <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#38bdf8' }}>⚡ Autonomous Anomaly & Defense Triggers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={triggerEngineSOS} style={{ background: '#b91c1c', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              🚨 Simulate IoT Engine Breakdown & SOS
            </button>
            <button onClick={triggerPiracyDefense} style={{ background: '#c2410c', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              ⚔️ Activate Anti-Piracy Citadel Defense
            </button>
            <button onClick={triggerSmugglingCheck} style={{ background: '#a21caf', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              📦 Run Autonomous Anti-Smuggling Scan
            </button>
          </div>
        </div>

      </div>

      {/* TELEMETRY FOOTER BAR */}
      <div style={{ marginTop: '20px', background: '#111827', padding: '16px', borderRadius: '12px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '13px' }}>
        <div>Vessel Status: <strong style={{ color: activeAlert ? '#ef4444' : '#22c55e' }}>{activeAlert ? 'ALERT CONDITION' : 'NOMINAL'}</strong></div>
        <div>Edge Processing: <strong>100% Offline Capable (TensorFlow Lite)</strong></div>
        <div>Distress Freq: <strong>VHF Ch 16 / 406 MHz EPIRB</strong></div>
        <div>Regulatory Standard: <strong>IMO 2026 / ISPS Citadel Code</strong></div>
      </div>

    </div>
  );
}