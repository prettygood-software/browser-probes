import { type LanguageCode, languages } from "./languages.ts";

export interface GreetOptions {
  name?: string;
  language?: LanguageCode;
  emoji?: boolean;
}

const EMOJI = "👋";

export function greet({ name = "World", language = "en", emoji = false }: GreetOptions): string {
  // language is constrained to LanguageCode (keyof typeof languages), so this lookup is safe.
  // eslint-disable-next-line security/detect-object-injection
  const hello = languages[language];
  const message = `${hello}, ${name}!`;
  return emoji ? `${EMOJI} ${message}` : message;
}

export type { LanguageCode } from "./languages.ts";
export { isSupportedLanguage, languages, supportedLanguages } from "./languages.ts";
