import { Language, LanguageInfo, SUPPORTED_LANGUAGES } from './types';
import { pt } from './locales/pt';
import { en } from './locales/en';
import { es } from './locales/es';

export * from './types';

export const TRANSLATIONS = {
  pt,
  en,
  es,
};

export type TranslationsType = typeof pt;

/**
 * Normalizes any language code/input (including 'sp', 'es-MX', 'pt-BR', etc.)
 * to the supported 'pt' | 'en' | 'es' codes.
 */
export function normalizeLanguage(lang?: string | null): Language {
  if (!lang || typeof lang !== 'string') return 'pt';
  const lower = lang.toLowerCase().trim();
  if (lower === 'es' || lower === 'sp' || lower.startsWith('es-') || lower.startsWith('es_') || lower.startsWith('sp-')) {
    return 'es';
  }
  if (lower === 'en' || lower.startsWith('en-') || lower.startsWith('en_')) {
    return 'en';
  }
  if (lower === 'pt' || lower.startsWith('pt-') || lower.startsWith('pt_')) {
    return 'pt';
  }
  return 'pt';
}

/**
 * Detects the user's browser default language.
 * Checks navigator.languages and navigator.language.
 */
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'pt';
  }

  const browserLanguages: readonly string[] =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ''];

  for (const lang of browserLanguages) {
    if (!lang) continue;
    const lower = lang.toLowerCase().trim();
    if (lower.startsWith('pt')) return 'pt';
    if (lower.startsWith('es') || lower.startsWith('sp')) return 'es';
  }

  for (const lang of browserLanguages) {
    if (!lang) continue;
    const lower = lang.toLowerCase().trim();
    if (lower.startsWith('en')) return 'en';
  }

  return 'pt';
}

/**
 * Gets the initial active language.
 * 1. Checks URL query parameter ?lang= (e.g. ?lang=en, ?lang=es, ?lang=sp)
 * 2. Checks user's manual selection in localStorage ('skoolia_language')
 * 3. Detects default browser locale (pt, es, or en)
 */
export function getInitialLanguage(): Language {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang') || params.get('language') || params.get('locale');
      if (urlLang) {
        const normalized = normalizeLanguage(urlLang);
        try {
          localStorage.setItem('skoolia_language', normalized);
        } catch (_) {}
        return normalized;
      }
    }

    const saved = localStorage.getItem('skoolia_language');
    if (saved) {
      return normalizeLanguage(saved);
    }
  } catch (e) {
    // Ignore localStorage access errors
  }

  return detectBrowserLanguage();
}

/**
 * Retrieves raw nested translation object/array/value by dot notation.
 */
export function getRawTranslation<T = any>(
  lang: Language | string,
  path: string,
  fallbackValue?: T
): T {
  const normLang = normalizeLanguage(lang as string);
  const currentLocale = TRANSLATIONS[normLang] || TRANSLATIONS.pt;
  const fallbackLocale = TRANSLATIONS.pt;

  const keys = path.split('.');
  let result: any = currentLocale;
  let fallback: any = fallbackLocale;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      result = undefined;
      break;
    }
  }

  if (result === undefined) {
    for (const key of keys) {
      if (fallback && typeof fallback === 'object' && key in fallback) {
        fallback = fallback[key];
      } else {
        fallback = undefined;
        break;
      }
    }
    result = fallback;
  }

  return (result !== undefined ? result : fallbackValue) as T;
}

/**
 * Retrieves string array translation by dot notation.
 */
export function getTranslationArray(
  lang: Language | string,
  path: string,
  fallbackArray: string[] = []
): string[] {
  const res = getRawTranslation<unknown>(lang, path, fallbackArray);
  if (Array.isArray(res)) {
    return res as string[];
  }
  return fallbackArray;
}

/**
 * Retrieves nested translation by dot notation (e.g. 'sidebar.dashboard', 'common.save').
 */
export function getTranslation(
  lang: Language | string,
  path: string,
  params?: Record<string, string | number>
): string {
  const raw = getRawTranslation<unknown>(lang, path);

  if (typeof raw !== 'string') {
    return path;
  }

  if (params) {
    return Object.entries(params).reduce((acc, [k, v]) => {
      return acc.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }, raw);
  }

  return raw;
}

export function getLanguageInfo(lang: Language | string): LanguageInfo {
  const norm = normalizeLanguage(lang as string);
  return SUPPORTED_LANGUAGES.find((l) => l.code === norm) || SUPPORTED_LANGUAGES[0];
}
