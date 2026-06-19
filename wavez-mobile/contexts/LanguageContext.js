// contexts/LanguageContext.js
// Single source of truth for Hebrew ↔ English language switching.
// Provides: language, isRTL, dir (textAlign), locale, toggleLanguage, t(), tBeach()
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

// ─── Beach Names ─────────────────────────────────────────────────────────────
const BEACH_NAMES = {
  he: {
    "Haifa_BatGalim":     "חיפה - בת גלים",
    "Haifa_Nirvana":      "חיפה - נירוונה",
    "Haifa_Meridian":     "חיפה - מרידיאן",
    "Krayot_MagicBoards": "קריות - מג'יק",
    "Maagan_Michael":     "מעגן מיכאל",
    "Beit_Yanai":         "בית ינאי",
    "Herzliya_Marina":    "הרצליה - מרינה",
    "Herzliya_Dromi":     "הרצליה - דרומי",
    "TLV_Dolphinarium":   "תל אביב - דולפינריום",
    "Ma'aravi_tel_aviv":  "תל אביב - מערבי",
    "TLV_Hilton":         "תל אביב - הילטון",
  },
  en: {
    "Haifa_BatGalim":     "Haifa - Bat Galim",
    "Haifa_Nirvana":      "Haifa - Nirvana",
    "Haifa_Meridian":     "Haifa - Meridian",
    "Krayot_MagicBoards": "Krayot - Magic",
    "Maagan_Michael":     "Ma'agan Michael",
    "Beit_Yanai":         "Beit Yanai",
    "Herzliya_Marina":    "Herzliya - Marina",
    "Herzliya_Dromi":     "Herzliya - South",
    "TLV_Dolphinarium":   "Tel Aviv - Dolphinarium",
    "Ma'aravi_tel_aviv":  "Tel Aviv - West",
    "TLV_Hilton":         "Tel Aviv - Hilton",
  },
};

// ─── UI Strings ──────────────────────────────────────────────────────────────
const STRINGS = {
  he: {
    // Home screen
    selectBeachLabel:   "בחר חוף לצפייה:",
    loading:            "טוען...",
    selectBeachModal:   "בחר חוף",
    lastUpdate:         "עדכון אחרון",
    surfers:            "גולשים",
    waveHeight:         "גובה גל",
    windKmh:            'קמ"ש רוח',
    latestPhoto:        "📷 תמונה אחרונה",
    updated:            "עודכן",
    noImage:            "אין תמונה זמינה",
    tipTitle:           "💡 טיפ: לחוויה אידיאלית ומסך מלא",
    tipBody:            "מומלץ להוסיף את האפליקציה למסך הבית",
    tipHint:            "(אייפון: שתף ⭠ הוסף למסך הבית | אנדרואיד: תפריט ⭠ התקן אפליקציה)",
    feedbackBtn:        "זיהית באג? נשמח למשוב שלך!",
    termsLink:          "תנאי שימוש ונגישות",
    // Map popup
    mapSurfers:         "גולשים",
    mapWave:            "גל",
    mapWind:            'קמ"ש',
    mapScore:           "ציון:",
    mapLastUpdate:      "עדכון אחרון:",
    mapNoData:          "אין נתונים זמינים כרגע",
    // Surf score labels
    scoreExcellent:     "מעולה 🟢",
    scoreGood:          "בסדר 🟠",
    scoreBusy:          "עמוס 🔴",
    scoreNoData:        "אין נתונים",
    // Bottom nav
    navHome:            "ראשי",
    navMap:             "מפה",
    navForecast:        "תחזית",
    // Page titles
    forecastTitle:      "תחזית חכמה",
    // Feedback modal
    feedbackModalTitle: "ראית משהו לשיפור?",
    feedbackName:       "שם (חובה)",
    feedbackEmail:      "מייל (חובה)",
    feedbackPhone:      "טלפון (אופציונלי)",
    feedbackDesc:       "תיאור הפנייה",
    feedbackSend:       "שלח",
    feedbackThanks:     "תודה על המשוב!",
    feedbackError:      "אירעה שגיאה. נסה שוב.",
    feedbackRequired:   "נא למלא שם ומייל",
    // CrowdForecast component
    cfSelectBeach:      "בחר חוף:",
    cfSelectBeachModal: "בחר חוף",
    cfSelectDate:       "בחר תאריך:",
    cfSelectDateModal:  "בחר תאריך",
    cfLoading:          "טוען תחזית...",
    cfChartTitle:       "מגמת עומס יומית",
    cfNoData:           "אין נתונים ליום זה",
    cfChartNote:        "* המספרים על הגרף מייצגים כמות גולשים משוערת",
    // Terms page
    termsBack:          "חזור",
    termsTitle:         "תנאי שימוש ונגישות",
    termsEnglishNote:   null,
  },
  en: {
    // Home screen
    selectBeachLabel:   "Select a beach:",
    loading:            "Loading...",
    selectBeachModal:   "Select Beach",
    lastUpdate:         "Last Update",
    surfers:            "Surfers",
    waveHeight:         "Wave Height",
    windKmh:            "Wind km/h",
    latestPhoto:        "📷 Latest Photo",
    updated:            "Updated",
    noImage:            "No image available",
    tipTitle:           "💡 Tip: For the best full-screen experience",
    tipBody:            "Add the app to your home screen",
    tipHint:            "(iPhone: Share ⭢ Add to Home Screen | Android: Menu ⭢ Install App)",
    feedbackBtn:        "Found a bug? Share your feedback!",
    termsLink:          "Terms of Use & Accessibility",
    // Map popup
    mapSurfers:         "Surfers",
    mapWave:            "Wave",
    mapWind:            "km/h",
    mapScore:           "Score:",
    mapLastUpdate:      "Last update:",
    mapNoData:          "No data available",
    // Surf score labels
    scoreExcellent:     "Excellent 🟢",
    scoreGood:          "Good 🟠",
    scoreBusy:          "Busy 🔴",
    scoreNoData:        "No data",
    // Bottom nav
    navHome:            "Home",
    navMap:             "Map",
    navForecast:        "Forecast",
    // Page titles
    forecastTitle:      "Smart Forecast",
    // Feedback modal
    feedbackModalTitle: "Seen something to improve?",
    feedbackName:       "Name (required)",
    feedbackEmail:      "Email (required)",
    feedbackPhone:      "Phone (optional)",
    feedbackDesc:       "Describe your feedback",
    feedbackSend:       "Send",
    feedbackThanks:     "Thanks for the feedback!",
    feedbackError:      "An error occurred. Please try again.",
    feedbackRequired:   "Please fill in your name and email",
    // CrowdForecast component
    cfSelectBeach:      "Select a beach:",
    cfSelectBeachModal: "Select Beach",
    cfSelectDate:       "Select a date:",
    cfSelectDateModal:  "Select Date",
    cfLoading:          "Loading forecast...",
    cfChartTitle:       "Daily Crowd Forecast",
    cfNoData:           "No data for this day",
    cfChartNote:        "* Numbers on the chart represent estimated surfer count",
    // Terms page
    termsBack:          "Back",
    termsTitle:         "Terms of Use & Accessibility",
    termsEnglishNote:   "This page is currently available in Hebrew only.",
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const LanguageContext = createContext(null);

/** Apply document-level direction for web PWA (instant, no reload required). */
const applyDocumentDirection = (lang) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang === 'he' ? 'he' : 'en';
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('he');

  // Restore persisted language on first mount
  useEffect(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('wavez_language');
      if (saved === 'en' || saved === 'he') {
        setLanguage(saved);
        applyDocumentDirection(saved);
      }
    }
  }, []);

  const toggleLanguage = () => {
    const next = language === 'he' ? 'en' : 'he';
    setLanguage(next);
    applyDocumentDirection(next);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem('wavez_language', next);
    }
  };

  const isRTL  = language === 'he';
  const dir    = isRTL ? 'right' : 'left';          // textAlign helper
  const locale = language === 'he' ? 'he-IL' : 'en-US'; // date/time locale

  /** Returns the UI string for key in the active language. Falls back to Hebrew. */
  const t = (key) => STRINGS[language]?.[key] ?? STRINGS['he']?.[key] ?? key;

  /** Returns the translated beach display name. */
  const tBeach = (beachKey) => BEACH_NAMES[language]?.[beachKey] ?? beachKey;

  return (
    <LanguageContext.Provider value={{ language, isRTL, dir, locale, toggleLanguage, t, tBeach }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};
