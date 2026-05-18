import type { Probe, ProbeContext } from "../../types.ts";
import { lookupGeo, readBrowserSignals } from "./scrape.ts";
import type { CoherenceVerdict, GeoIpResult } from "./types.ts";

export const geoipProbe: Probe<GeoIpResult> = {
  name: "geoip",
  description:
    "Cross-check browser fingerprint (locale, timezone) against the proxy's exit-IP geolocation.",
  async run(ctx: ProbeContext): Promise<GeoIpResult> {
    const adapterExitIp = ctx.browser.exitIp;
    const browserSignals = await readBrowserSignals(ctx.browser.page);

    const ipToLookUp = browserSignals.exitIpFromBrowser ?? adapterExitIp;
    if (!ipToLookUp) {
      return { adapterExitIp, browserSignals, geo: null, verdict: null };
    }

    ctx.logger?.info({ ip: ipToLookUp }, "reverse-geocoding exit ip via ipapi.co");
    const geo = await lookupGeo(ipToLookUp);
    const verdict = buildVerdict(
      browserSignals.language,
      browserSignals.timezone,
      geo.country,
      geo.timezone,
    );

    return { adapterExitIp, browserSignals, geo, verdict };
  },
  format(result: GeoIpResult): string {
    const s = result.browserSignals;
    const lines = [
      `  adapter exit IP:    ${result.adapterExitIp ?? "NULL (impit probe failed)"}`,
      `  browser exit IP:    ${s.exitIpFromBrowser ?? "(fetch failed)"}`,
      `  language:           ${s.language}`,
      `  languages:          ${s.languages.join(", ")}`,
      `  timezone:           ${s.timezone} (offset ${String(s.timezoneOffsetMin)}min)`,
      `  platform:           ${s.platform}`,
      `  UA:                 ${s.userAgent}`,
      `  WebGL vendor:       ${s.webglVendor}`,
      `  WebGL renderer:     ${s.webglRenderer}`,
      `  screen:             ${String(s.screenWidth)}x${String(s.screenHeight)} (inner ${String(s.innerWidth)}x${String(s.innerHeight)})`,
    ];
    if (result.geo) {
      lines.push(
        ``,
        `  geo country:        ${result.geo.country ?? "?"}`,
        `  geo region:         ${result.geo.region ?? "?"}`,
        `  geo city:           ${result.geo.city ?? "?"}`,
        `  geo timezone:       ${result.geo.timezone ?? "?"}`,
      );
    }
    if (result.verdict) {
      const v = result.verdict;
      lines.push(
        ``,
        `  language country tag:           ${v.languageCountry ?? "(none)"}`,
        `  language ↔ exit-IP country:    ${v.languageMatchesIpCountry ? "MATCH" : "MISMATCH ✗"}`,
        `  timezone ↔ exit-IP timezone:   ${v.timezoneMatchesIpTimezone ? "MATCH" : "MISMATCH ✗"}`,
      );
    }
    return `${lines.join("\n")}\n`;
  },
};

function buildVerdict(
  language: string,
  timezone: string,
  ipCountry: string | null,
  ipTimezone: string | null,
): CoherenceVerdict {
  const langCountry = language.split("-")[1]?.toUpperCase() ?? null;
  return {
    languageCountry: langCountry,
    languageMatchesIpCountry:
      langCountry !== null && ipCountry !== null && langCountry === ipCountry.toUpperCase(),
    timezoneMatchesIpTimezone: ipTimezone !== null && timezone === ipTimezone,
  };
}
