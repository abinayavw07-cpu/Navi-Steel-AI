/**
 * NAVI-STEEL AI — Web Speech Synthesis Engine
 * Supports: English (en-US), Tamil (ta-IN), Hindi (hi-IN)
 */

const VOICE_LANG_MAP = {
  en: "en-US",
  ta: "ta-IN",
  hi: "hi-IN",
};

// Pre-built phrase library
const PHRASES = {
  en: {
    weatherAlert:      (loc) => `Warning! Severe cyclone detected near ${loc}. All vessels advised to divert immediately.`,
    fuelAdvice:        (port, price) => `Optimal bunkering recommended at ${port}. Current VLSFO price is ${price} per metric ton.`,
    routeUpdate:       (from, to, eta) => `Route confirmed from ${from} to ${to}. Estimated time of arrival is ${eta}.`,
    piracyAlert:       () => `Piracy alert activated. Initiating citadel defense protocol. All crew to muster stations.`,
    ciiWarning:        (rating) => `Carbon Intensity Indicator rated ${rating}. Port penalty risk is elevated. Reduce speed advised.`,
    aisSpoof:          (vessel) => `Dark fleet alert. Vessel ${vessel} has disabled AIS transponder. Reporting to Maritime Authority.`,
    offline:           () => `Network offline. Dashboard operating on cached data. Live feeds suspended.`,
    online:            () => `Network restored. Live AIS and weather feeds are now active.`,
    icebergDetected:   (id, dist) => `Warning! Iceberg ${id} detected at ${dist} nautical miles. Auto-course diversion initiated.`,
    icebergSonarOn:    () => `Iceberg Thermal Sonar activated. Scanning sub-surface ice hazards in Arctic corridor.`,
    icebergSonarOff:   () => `Thermal sonar deactivated. Manual ice watch required.`,
    icebergSpeedCut:   () => `Emergency speed reduction engaged. Reverse thrusters online. Vessel slowing to 4 knots.`,
    icebergFogAlert:   (pct) => `Extreme fog alert. Visibility reduced to ${pct} percent. All crew to collision-watch stations.`,
    icebergAllClear:   () => `Arctic corridor scan complete. No immediate ice hazards detected. Safe passage confirmed.`,
  },
  ta: {
    weatherAlert:      (loc) => `எச்சரிக்கை! ${loc} அருகே கடுமையான புயல் கண்டறியப்பட்டது. அனைத்து கப்பல்களும் உடனடியாக வழிதிருப்பவும்.`,
    fuelAdvice:        (port, price) => `${port} துறைமுகத்தில் எரிபொருள் நிரப்புவது சிறந்தது. தற்போதைய VLSFO விலை மெட்ரிக் டன்னுக்கு ${price}.`,
    routeUpdate:       (from, to, eta) => `${from} இலிருந்து ${to} வரை பாதை உறுதிப்படுத்தப்பட்டது. வருகை நேரம் ${eta}.`,
    piracyAlert:       () => `கடல்கொள்ளை எச்சரிக்கை! கோட்டை பாதுகாப்பு நடவடிக்கை தொடங்கப்படுகிறது.`,
    ciiWarning:        (rating) => `கார்பன் தீவிர குறியீடு ${rating} என மதிப்பிடப்பட்டுள்ளது. வேகம் குறைக்கவும்.`,
    aisSpoof:          (vessel) => `இருண்ட கடற்படை எச்சரிக்கை. ${vessel} கப்பல் AIS முடக்கியுள்ளது.`,
    offline:           () => `இணையம் துண்டிக்கப்பட்டது. தரவு தற்காலிகமாக சேமிக்கப்பட்டது பயன்படுத்தப்படுகிறது.`,
    online:            () => `இணையம் மீண்டும் இணைக்கப்பட்டது. நேரடி தரவு செயல்படுகிறது.`,
    icebergDetected:   (id, dist) => `எச்சரிக்கை! ${id} பனிப்பாறை ${dist} கடல் மைல் தொலைவில் கண்டறியப்பட்டது. தானியங்கி பாதை திருப்புதல் தொடங்கப்பட்டது.`,
    icebergSonarOn:    () => `பனிப்பாறை வெப்ப சோனார் செயல்படுத்தப்பட்டது. ஆர்க்டிக் பாதையில் ஆழ்கடல் பனி ஆபத்துகள் ஸ்கேன் செய்யப்படுகின்றன.`,
    icebergSonarOff:   () => `வெப்ப சோனார் முடக்கப்பட்டது. கைமுறை பனி கண்காணிப்பு தேவை.`,
    icebergSpeedCut:   () => `அவசர வேக குறைப்பு செயல்படுத்தப்பட்டது. தலைகீழ் உந்துவிசை ஆன்லைன். கப்பல் 4 நாட்டிக்கல் மைல் வரை குறைகிறது.`,
    icebergFogAlert:   (pct) => `கடுமையான மூட எச்சரிக்கை. தெரிவுத்திறன் ${pct} சதவீதமாக குறைந்துள்ளது. அனைத்து பணியாளர்களும் மோதல் கண்காணிப்பு நிலைக்கு வரவும்.`,
    icebergAllClear:   () => `ஆர்க்டிக் பாதை ஸ்கேன் முடிந்தது. உடனடி பனி ஆபத்துகள் இல்லை. பாதுகாப்பான பயணம் உறுதிப்படுத்தப்பட்டது.`,
  },
  hi: {
    weatherAlert:      (loc) => `चेतावनी! ${loc} के पास भीषण चक्रवात का पता चला है। सभी जहाजों को तुरंत मार्ग बदलने की सलाह दी जाती है।`,
    fuelAdvice:        (port, price) => `${port} बंदरगाह पर ईंधन भरना सर्वोत्तम है। वर्तमान VLSFO मूल्य प्रति मीट्रिक टन ${price} है।`,
    routeUpdate:       (from, to, eta) => `${from} से ${to} का मार्ग पुष्टि हो गया है। अनुमानित आगमन समय ${eta} है।`,
    piracyAlert:       () => `समुद्री डकैती चेतावनी! गढ़ रक्षा प्रोटोकॉल सक्रिय किया जा रहा है।`,
    ciiWarning:        (rating) => `कार्बन तीव्रता सूचकांक ${rating} रेट किया गया है। गति कम करने की सलाह है।`,
    aisSpoof:          (vessel) => `डार्क फ्लीट अलर्ट। ${vessel} जहाज ने AIS ट्रांसपोंडर बंद कर दिया है।`,
    offline:           () => `नेटवर्क ऑफलाइन है। डैशबोर्ड कैश डेटा पर चल रहा है।`,
    online:            () => `नेटवर्क बहाल हो गया। लाइव फ़ीड अब सक्रिय हैं।`,
    icebergDetected:   (id, dist) => `चेतावनी! आइसबर्ग ${id} ${dist} नॉटिकल मील की दूरी पर पाया गया। स्वचालित मार्ग विचलन शुरू हो गया।`,
    icebergSonarOn:    () => `आइसबर्ग थर्मल सोनार सक्रिय। आर्कटिक गलियारे में उप-सतह बर्फ खतरों की स्कैनिंग हो रही है।`,
    icebergSonarOff:   () => `थर्मल सोनार निष्क्रिय। मैन्युअल बर्फ निगरानी आवश्यक।`,
    icebergSpeedCut:   () => `आपातकालीन गति कटौती लागू। रिवर्स थ्रस्टर ऑनलाइन। जहाज 4 नॉट तक धीमा हो रहा है।`,
    icebergFogAlert:   (pct) => `अत्यधिक धुंध चेतावनी। दृश्यता ${pct} प्रतिशत तक घट गई। सभी दल टक्कर-निगरानी पर आएं।`,
    icebergAllClear:   () => `आर्कटिक गलियारा स्कैन पूरा। कोई तत्काल बर्फ खतरा नहीं। सुरक्षित मार्ग की पुष्टि।`,
  },
};

let _currentUtterance = null;

/**
 * Speak a message in the given language.
 * @param {string} text - Text to speak
 * @param {string} lang - Language code: 'en' | 'ta' | 'hi'
 * @param {{ rate?: number, pitch?: number, volume?: number }} opts
 */
export function speak(text, lang = "en", opts = {}) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang   = VOICE_LANG_MAP[lang] ?? "en-US";
  utter.rate   = opts.rate   ?? 0.95;
  utter.pitch  = opts.pitch  ?? 1.0;
  utter.volume = opts.volume ?? 1.0;

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const match  = voices.find((v) => v.lang.startsWith(VOICE_LANG_MAP[lang]?.split("-")[0] ?? "en"));
  if (match) utter.voice = match;

  _currentUtterance = utter;
  window.speechSynthesis.speak(utter);
}

/** Stop any current speech immediately */
export function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

/**
 * Speak a named pre-built phrase.
 * @param {"weatherAlert"|"fuelAdvice"|"routeUpdate"|"piracyAlert"|"ciiWarning"|"aisSpoof"|"offline"|"online"} phraseKey
 * @param {string} lang
 * @param {...any} args - Arguments forwarded to the phrase builder
 */
export function speakPhrase(phraseKey, lang = "en", ...args) {
  const builder = PHRASES[lang]?.[phraseKey] ?? PHRASES.en[phraseKey];
  if (!builder) return;
  speak(builder(...args), lang);
}

export { PHRASES };
