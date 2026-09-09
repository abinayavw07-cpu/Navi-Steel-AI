/**
 * LanguageContext — Global language state for NAVI-STEEL AI
 *
 * Provides:
 *   language       — current active locale code: "en" | "ta" | "hi"
 *   setLanguage(l) — update locale instantly across entire app
 *   t(key)         — translate a key using the active locale
 *
 * Usage:
 *   // Wrap the app tree once:
 *   <LanguageProvider initialLang="en">...</LanguageProvider>
 *
 *   // Consume anywhere:
 *   const { language, setLanguage, t } = useLanguage();
 */
import { createContext, useContext, useState, useCallback } from "react";
import { t as translate } from "./translations";

// ─── Context ──────────────────────────────────────────────────────────────────
const LanguageContext = createContext({
  language:    "en",
  setLanguage: () => {},
  t:           (key) => key,
});

// ─── Provider ────────────────────────────────────────────────────────────────
export function LanguageProvider({ children, initialLang = "en" }) {
  const [language, setLangState] = useState(
    /** Persist preference in localStorage */ () => {
      try {
        const saved = localStorage.getItem("navi_lang");
        return ["en", "ta", "hi"].includes(saved) ? saved : initialLang;
      } catch {
        return initialLang;
      }
    }
  );

  const setLanguage = useCallback((lang) => {
    if (!["en", "ta", "hi"].includes(lang)) return;
    setLangState(lang);
    try { localStorage.setItem("navi_lang", lang); } catch { /* ignore */ }
  }, []);

  /** Bound translator — always uses current language */
  const t = useCallback((key) => translate(key, language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLanguage() {
  return useContext(LanguageContext);
}

export default LanguageContext;
