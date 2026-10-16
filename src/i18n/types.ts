export type Language = 'pt' | 'en' | 'es';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  countryCode: string;
  locale: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'pt',
    name: 'Português',
    nativeName: 'Português (BR)',
    flag: '🇧🇷',
    countryCode: 'BR',
    locale: 'pt-BR',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    countryCode: 'US',
    locale: 'en-US',
  },
  {
    code: 'es',
    name: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸',
    countryCode: 'ES',
    locale: 'es-ES',
  },
];
