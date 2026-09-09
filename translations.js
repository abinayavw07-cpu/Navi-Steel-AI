/**
 * NAVI-STEEL AI — Central i18n Translation Store
 * Covers every UI string across the application.
 * Keys are English identifiers; values are objects with en / ta / hi translations.
 *
 * Usage:
 *   import { useLanguage } from "../i18n/LanguageContext";
 *   const { t } = useLanguage();
 *   <h1>{t("appName")}</h1>
 */

const TRANSLATIONS = {
  // ── App / Header ──────────────────────────────────────────────────────────
  appName:          { en: "NAVI-STEEL", ta: "நாவி-ஸ்டீல்",      hi: "नावी-स्टील"         },
  appTagline:       { en: "Bulk Freight Intelligence", ta: "மொத்த சரக்கு நுண்ணறிவு", hi: "बल्क फ्रेट इंटेलिजेंस" },
  live:             { en: "Live",         ta: "நேரடி",            hi: "लाइव"              },
  offline:          { en: "Offline",      ta: "ஆஃப்லைன்",        hi: "ऑफलाइन"           },
  export:           { en: "Export",       ta: "ஏற்றுமதி",        hi: "निर्यात"           },
  logout:           { en: "Logout",       ta: "வெளியேறு",        hi: "लॉगआउट"           },
  language:         { en: "Language",     ta: "மொழி",             hi: "भाषा"              },
  currency:         { en: "Currency",     ta: "நாணயம்",          hi: "मुद्रा"            },
  voiceAlerts:      { en: "Voice Alerts", ta: "குரல் எச்சரிக்கைகள்", hi: "आवाज़ अलर्ट"  },
  voiceOn:          { en: "On",           ta: "இயக்கு",          hi: "चालू"              },
  voiceOff:         { en: "Off",          ta: "நிறுத்து",        hi: "बंद"               },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabVoyage:        { en: "Voyage Optimizer",       ta: "கப்பல் திட்டமிடல்",    hi: "वॉयेज ऑप्टिमाइज़र" },
  tabAIS:           { en: "Marine.com Live AIS",    ta: "Marine.com நேரடி AIS", hi: "Marine.com लाइव AIS" },
  tabGeoNav:        { en: "GeoNav Tactical Radar",  ta: "ஜியோநேவ் ரேடார்",    hi: "जियोनेव रडार"         },
  tabBunker:        { en: "Bunker Fuel",             ta: "எரிபொருள்",            hi: "बंकर ईंधन"           },
  tabCompliance:    { en: "Compliance Suite",        ta: "இணக்கத் தொகுப்பு",   hi: "अनुपालन सूट"         },
  tabPayments:      { en: "Payments & Vault",        ta: "கட்டணங்கள் & வால்ட்", hi: "भुगतान और वॉल्ट"    },
  tabDocAuth:       { en: "Doc Authenticator",       ta: "ஆவண சரிபார்ப்பு",   hi: "डॉक प्रमाणक"          },

  // ── Congestion / Ticker ───────────────────────────────────────────────────
  portCongestionAlert: { en: "PORT CONGESTION ALERT:", ta: "துறைமுக நெரிசல் எச்சரிக்கை:", hi: "पोर्ट कंजेशन अलर्ट:" },
  portCongestion:      { en: "CONGESTION:",            ta: "நெரிசல்:",                        hi: "भीड़:"               },
  liveAISFeed:         { en: "Live AIS feed · Updated 2 min ago", ta: "நேரடி AIS · 2 நிமிடம் முன்பு", hi: "लाइव AIS · 2 मिनट पहले" },
  offlineCached:       { en: "⚡ Offline — cached data", ta: "⚡ ஆஃப்லைன் — தற்காலிக தரவு", hi: "⚡ ऑफलाइन — कैश डेटा"    },

  // ── Voyage Stepper ────────────────────────────────────────────────────────
  voyageProgress:   { en: "Voyage Progress",     ta: "கப்பல் பயண முன்னேற்றம்", hi: "वॉयेज प्रगति"          },
  stepDeparture:    { en: "Departure",            ta: "புறப்பாடு",               hi: "प्रस्थान"               },
  stepWeather:      { en: "Weather Avoidance",    ta: "வானிலை தவிர்ப்பு",       hi: "मौसम बचाव"              },
  stepFuelStop:     { en: "Fuel Stop",            ta: "எரிபொருள் நிறுத்தம்",    hi: "ईंधन स्टॉप"             },
  stepArrival:      { en: "Arrival",              ta: "வருகை",                   hi: "आगमन"                  },

  // ── Charter Optimizer Form ────────────────────────────────────────────────
  charterOptimizer: { en: "Charter Optimizer",       ta: "சார்டர் மேம்படுத்தி",   hi: "चार्टर ऑप्टिमाइज़र"   },
  spotVsTC:         { en: "Spot vs. TC economic analysis", ta: "ஸ்பாட் vs TC பொருளாதார பகுப்பாய்வு", hi: "स्पॉट vs टीसी आर्थिक विश्लेषण" },
  originPort:       { en: "Origin Port",              ta: "புறப்பாட்டு துறைமுகம்", hi: "उद्गम बंदरगाह"         },
  destPort:         { en: "Target Discharge Port",    ta: "இலக்கு துறைமுகம்",     hi: "लक्ष्य डिस्चार्ज पोर्ट" },
  cargoTonnage:     { en: "Cargo Tonnage (MT)",        ta: "சரக்கு டன்னேஜ் (MT)",  hi: "कार्गो टन्नेज (MT)"    },
  laycanDate:       { en: "Laycan Delivery Date",     ta: "Laycan தேதி",           hi: "लेकान डिलीवरी तारीख"  },
  runOptimizer:     { en: "Run Chartering Optimizer",  ta: "சார்டரிங் மேம்படுத்தி", hi: "चार्टरिंग ऑप्टिमाइज़र चलाएं" },
  optimizing:       { en: "Optimizing…",              ta: "மேம்படுத்துகிறது…",     hi: "ऑप्टिमाइज़ हो रहा है…" },

  // ── Metric cards ──────────────────────────────────────────────────────────
  spotFreightRate:  { en: "Spot Freight Rate",    ta: "ஸ்பாட் சரக்கு கட்டணம்",  hi: "स्पॉट फ्रेट रेट"        },
  vlsfoBunker:      { en: "VLSFO Bunker Price",   ta: "VLSFO எரிபொருள் விலை",    hi: "VLSFO बंकर मूल्य"       },
  ecDemurrage:      { en: "EC Demurrage Cost",    ta: "EC தாமத கட்டணம்",         hi: "EC डेमरेज लागत"          },
  aiAccuracy:       { en: "AI Model Accuracy",    ta: "AI மாதிரி துல்லியம்",      hi: "AI मॉडल सटीकता"          },
  perMT:            { en: "/MT",                  ta: "/MT",                       hi: "/MT"                    },
  perDay:           { en: "/day",                 ta: "/நாள்",                    hi: "/दिन"                   },

  // ── Voyage stats box ──────────────────────────────────────────────────────
  distance:         { en: "Distance",             ta: "தூரம்",                    hi: "दूरी"                   },
  eta:              { en: "ETA",                  ta: "வருகை நேரம்",              hi: "ETA"                    },
  estFuel:          { en: "Est. Fuel",            ta: "மதிப்பிட்ட எரிபொருள்",    hi: "अनुमानित ईंधन"           },
  demurrage:        { en: "Demurrage",            ta: "தாமத கட்டணம்",             hi: "डेमरेज"                  },

  // ── AI Recommendation ────────────────────────────────────────────────────
  aiRecommendation: { en: "AI CHARTERING RECOMMENDATION", ta: "AI சார்டரிங் பரிந்துரை", hi: "AI चार्टरिंग अनुशंसा" },
  decision:         { en: "Decision",             ta: "முடிவு",                   hi: "निर्णय"                  },
  confidence:       { en: "Confidence",           ta: "நம்பகத்தன்மை",            hi: "आत्मविश्वास"             },
  estSavings:       { en: "Est. Savings",         ta: "மதிப்பிட்ட சேமிப்பு",     hi: "अनुमानित बचत"            },
  freightForecast:  { en: "Freight Rate Forecast", ta: "சரக்கு கட்டண முன்னறிவிப்பு", hi: "फ्रेट रेट पूर्वानुमान" },
  historical:       { en: "Historical",           ta: "வரலாற்று",                 hi: "ऐतिहासिक"                },
  aiForecast:       { en: "AI Forecast",          ta: "AI முன்னறிவிப்பு",         hi: "AI पूर्वानुमान"          },
  today:            { en: "Today",                ta: "இன்று",                    hi: "आज"                     },

  // ── Region Mode Switcher ──────────────────────────────────────────────────
  eastCoastMode:    { en: "🟢 East Coast India Corridor", ta: "🟢 கிழக்கு கடற்கரை இந்தியா", hi: "🟢 पूर्वी तट भारत गलियारा" },
  globalMode:       { en: "🌐 Global Maritime Operations", ta: "🌐 உலகளாவிய கடல் நடவடிக்கைகள்", hi: "🌐 वैश्विक समुद्री परिचालन" },
  primaryMode:      { en: "PRIMARY · 80%",        ta: "முதன்மை · 80%",            hi: "प्राथमिक · 80%"          },
  globalPercent:    { en: "GLOBAL · 20%",         ta: "உலகளாவிய · 20%",          hi: "वैश्विक · 20%"           },
  switchGlobal:     { en: "Switch to Global Mode", ta: "உலகளாவிய முறைக்கு மாற்று", hi: "ग्लोबल मोड में स्विच करें" },
  switchEC:         { en: "Switch to East Coast", ta: "கிழக்கு கடற்கரைக்கு மாற்று", hi: "ईस्ट कोस्ट पर स्विच करें" },
  ecFeature1:       { en: "Fishing Fleet Radar",  ta: "மீன்பிடி படகு ரேடார்",    hi: "मत्स्य बेड़ा रडार"        },
  ecFeature2:       { en: "Bay of Bengal Cyclone Evasion", ta: "வங்காளவிரிகுடா புயல் தவிர்ப்பு", hi: "बंगाल की खाड़ी चक्रवात बचाव" },
  ecFeature3:       { en: "EC Port Congestion Tracker", ta: "EC துறைமுக நெரிசல் டிராக்கர்", hi: "EC पोर्ट कंजेशन ट्रैकर" },
  ecFeature4:       { en: "River Debris & Smuggling Scan", ta: "நதி குப்பை & கடத்தல் ஸ்கேன்", hi: "नदी मलबा और तस्करी स्कैन" },
  glFeature1:       { en: "Arctic Iceberg Thermal Radar", ta: "ஆர்க்டிக் பனிப்பாறை ரேடார்", hi: "आर्कटिक हिमखंड थर्मल रडार" },
  glFeature2:       { en: "Global Bunker Price Index", ta: "உலகளாவிய எரிபொருள் விலை", hi: "वैश्विक बंकर मूल्य सूचकांक" },
  glFeature3:       { en: "IMO 2026 CII/EEXI Predictor", ta: "IMO 2026 CII/EEXI கணிப்பான்", hi: "IMO 2026 CII/EEXI प्रेडिक्टर" },

  // ── Marine.com AIS Tab ────────────────────────────────────────────────────
  marineAISTitle:   { en: "Marine.com Live AIS Radar", ta: "Marine.com நேரடி AIS ரேடார்", hi: "Marine.com लाइव AIS रडार" },
  aisFeed:          { en: "AIS Live Stream",           ta: "AIS நேரடி ஸ்ட்ரீம்",       hi: "AIS लाइव स्ट्रीम"        },
  aisSnapshot:      { en: "Cached Snapshot",           ta: "தற்காலிக படம்",             hi: "कैश्ड स्नैपशॉट"          },
  openFullMap:      { en: "Open Full Map ↗",           ta: "முழு வரைபடம் திற ↗",       hi: "पूर्ण मानचित्र खोलें ↗"  },
  noInternetAIS:    { en: "No internet connection",    ta: "இணைய இணைப்பு இல்லை",       hi: "इंटरनेट कनेक्शन नहीं"   },
  route:            { en: "Route",                     ta: "பாதை",                       hi: "मार्ग"                   },

  // ── Voice Command Bar ─────────────────────────────────────────────────────
  voiceEngine:      { en: "Voice Command Engine",      ta: "குரல் கட்டளை எஞ்சின்",    hi: "वॉयस कमांड इंजन"         },
  voiceSubtitle:    { en: "Web Speech · Maritime Commands", ta: "வலை பேச்சு · கடல் கட்டளைகள்", hi: "वेब स्पीच · समुद्री कमांड" },
  startListening:   { en: "Start Listening",           ta: "கேட்கத் தொடங்கு",         hi: "सुनना शुरू करें"          },
  stopListening:    { en: "Stop Listening",            ta: "கேட்பதை நிறுத்து",         hi: "सुनना बंद करें"            },
  listening:        { en: "Listening…",                ta: "கேட்கிறது…",               hi: "सुन रहा है…"               },
  speakCommand:     { en: "Press mic and speak a command", ta: "மைக்ரோஃபோனை அழுத்தி கட்டளை கொடுங்கள்", hi: "माइक दबाएं और कमांड बोलें" },
  cmdExecuted:      { en: "✓ COMMAND EXECUTED:",       ta: "✓ கட்டளை நிறைவேற்றப்பட்டது:", hi: "✓ कमांड निष्पादित:" },
  cmdHistory:       { en: "Command History",           ta: "கட்டளை வரலாறு",            hi: "कमांड इतिहास"            },
  cmdUnknown:       { en: "Unknown",                   ta: "தெரியாத கட்டளை",           hi: "अज्ञात"                   },
  availableCommands:{ en: "Available Commands",        ta: "கிடைக்கக்கூடிய கட்டளைகள்", hi: "उपलब्ध कमांड"            },
  noSpeechErr:      { en: "No speech detected. Try again.", ta: "பேச்சு கண்டறியப்படவில்லை. மீண்டும் முயற்சி.", hi: "भाषण नहीं मिला। पुनः प्रयास करें।" },
  micDeniedErr:     { en: "Microphone permission denied.", ta: "மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது.", hi: "माइक्रोफ़ोन अनुमति अस्वीकृत।" },
  notSupported:     { en: "Web Speech API not available", ta: "வலை பேச்சு API கிடைக்கவில்லை", hi: "वेब स्पीच API उपलब्ध नहीं" },
  useChrome:        { en: "Use Chrome or Edge for voice commands.", ta: "குரல் கட்டளைகளுக்கு Chrome அல்லது Edge பயன்படுத்துங்கள்.", hi: "वॉयस कमांड के लिए Chrome या Edge उपयोग करें।" },
  continuousMode:   { en: "Continuous",                ta: "தொடர்ச்சியான",              hi: "निरंतर"                   },
  singleMode:       { en: "Single",                    ta: "ஒற்றை",                    hi: "एकल"                      },

  // ── Advanced Section ──────────────────────────────────────────────────────
  advancedSuite:    { en: "⚡ Advanced Maritime Intelligence Suite", ta: "⚡ மேம்பட்ட கடல் நுண்ணறிவு தொகுப்பு", hi: "⚡ उन्नत समुद्री इंटेलिजेंस सूट" },

  // ── Login ─────────────────────────────────────────────────────────────────
  signIn:           { en: "Sign In",        ta: "உள்நுழைய",           hi: "साइन इन"              },
  signUp:           { en: "Sign Up",        ta: "பதிவு செய்ய",        hi: "साइन अप"               },
  email:            { en: "Email",          ta: "மின்னஞ்சல்",         hi: "ईमेल"                  },
  password:         { en: "Password",       ta: "கடவுச்சொல்",         hi: "पासवर्ड"               },
  displayName:      { en: "Display Name",   ta: "காட்சி பெயர்",       hi: "प्रदर्शन नाम"           },
  continueGoogle:   { en: "Continue with Google", ta: "Google மூலம் தொடரவும்", hi: "Google से जारी रखें" },
  noAccount:        { en: "No account?",    ta: "கணக்கு இல்லையா?",   hi: "खाता नहीं है?"          },
  haveAccount:      { en: "Have an account?", ta: "கணக்கு உள்ளதா?",  hi: "खाता है?"               },
};

/**
 * Get a translated string.
 * @param {string} key        — key from TRANSLATIONS
 * @param {"en"|"ta"|"hi"} lang
 * @returns {string}
 */
export function t(key, lang = "en") {
  const entry = TRANSLATIONS[key];
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing translation key: "${key}"`);
    }
    return key;
  }
  return entry[lang] ?? entry.en ?? key;
}

export default TRANSLATIONS;
