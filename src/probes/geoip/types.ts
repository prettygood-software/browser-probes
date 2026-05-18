export interface BrowserSignals {
  language: string;
  languages: readonly string[];
  timezone: string;
  timezoneOffsetMin: number;
  platform: string;
  userAgent: string;
  webglVendor: string;
  webglRenderer: string;
  screenWidth: number;
  screenHeight: number;
  innerWidth: number;
  innerHeight: number;
  /** Exit IP as observed by `fetch()` from inside the page, or null on failure. */
  exitIpFromBrowser: string | null;
}

export interface IpGeoLookup {
  ip: string;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
}

export interface CoherenceVerdict {
  /** Country tag extracted from `navigator.language` (e.g. "PL" from "pl-PL"). */
  languageCountry: string | null;
  /** Whether `languageCountry` matches the geocoded exit-IP country. */
  languageMatchesIpCountry: boolean;
  /** Whether the browser-reported timezone matches the geocoded exit-IP timezone. */
  timezoneMatchesIpTimezone: boolean;
}

export interface GeoIpResult {
  /** Exit IP from `BrowserHandle.exitIp` (impit-resolved at launch). */
  adapterExitIp: string | null;
  browserSignals: BrowserSignals;
  /** Reverse-geocode of the chosen exit IP. `null` if no IP could be looked up. */
  geo: IpGeoLookup | null;
  verdict: CoherenceVerdict | null;
}
