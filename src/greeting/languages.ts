export const languages = {
  en: "Hello",
  es: "Hola",
  fr: "Bonjour",
  de: "Hallo",
  ja: "こんにちは",
  zh: "你好",
} as const;

export type LanguageCode = keyof typeof languages;

export const supportedLanguages: readonly LanguageCode[] = Object.keys(languages) as LanguageCode[];

export const isSupportedLanguage = (value: string): value is LanguageCode =>
  Object.hasOwn(languages, value);
