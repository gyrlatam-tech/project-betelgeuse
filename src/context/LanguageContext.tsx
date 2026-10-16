import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Language,
  LanguageInfo,
  SUPPORTED_LANGUAGES,
  getInitialLanguage,
  getTranslation,
  getRawTranslation,
  getTranslationArray,
  getLanguageInfo,
  detectBrowserLanguage,
  normalizeLanguage,
  TRANSLATIONS,
} from '../i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language | string) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  tArray: (path: string, fallback?: string[]) => string[];
  tRaw: <T = any>(path: string, fallback?: T) => T;
  languageInfo: LanguageInfo;
  supportedLanguages: LanguageInfo[];
  browserLanguage: Language;
  translations: typeof TRANSLATIONS.pt;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());
  const browserLanguage = useMemo(() => detectBrowserLanguage(), []);

  const setLanguage = useCallback((lang: Language | string) => {
    const normalized = normalizeLanguage(lang);
    setLanguageState(normalized);
    try {
      localStorage.setItem('skoolia_language', normalized);
    } catch (e) {
      console.warn('Could not save language preference in localStorage:', e);
    }
  }, []);

  // Update HTML document lang attribute for accessibility and SEO
  useEffect(() => {
    const info = getLanguageInfo(language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = info.locale;
    }
  }, [language]);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return getTranslation(language, path, params);
    },
    [language]
  );

  const tArray = useCallback(
    (path: string, fallback?: string[]) => {
      return getTranslationArray(language, path, fallback);
    },
    [language]
  );

  const tRaw = useCallback(
    <T = any,>(path: string, fallback?: T): T => {
      return getRawTranslation<T>(language, path, fallback);
    },
    [language]
  );

  const languageInfo = useMemo(() => getLanguageInfo(language), [language]);
  const activeTranslations = useMemo(() => TRANSLATIONS[language] || TRANSLATIONS.pt, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      tArray,
      tRaw,
      languageInfo,
      supportedLanguages: SUPPORTED_LANGUAGES,
      browserLanguage,
      translations: activeTranslations,
    }),
    [language, setLanguage, t, tArray, tRaw, languageInfo, browserLanguage, activeTranslations]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
