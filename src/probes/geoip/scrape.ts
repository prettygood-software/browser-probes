import type { Page } from "playwright-core";

import type { BrowserSignals, IpGeoLookup } from "./types.ts";

export async function readBrowserSignals(page: Page): Promise<BrowserSignals> {
  await page.goto("about:blank");
  return page.evaluate(async (): Promise<BrowserSignals> => {
    const tzInfo = Intl.DateTimeFormat().resolvedOptions();
    const gl = ((): { vendor: string; renderer: string } => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("webgl");
        if (!ctx) return { vendor: "(no webgl)", renderer: "(no webgl)" };
        const dbg = ctx.getExtension("WEBGL_debug_renderer_info");
        if (!dbg) {
          return {
            vendor: ctx.getParameter(ctx.VENDOR) as string,
            renderer: ctx.getParameter(ctx.RENDERER) as string,
          };
        }
        return {
          vendor: ctx.getParameter(dbg.UNMASKED_VENDOR_WEBGL) as string,
          renderer: ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string,
        };
      } catch {
        return { vendor: "(error)", renderer: "(error)" };
      }
    })();
    let exitIpFromBrowser: string | null = null;
    try {
      const r = await fetch("https://api.ipify.org?format=text");
      if (r.ok) {
        const body = await r.text();
        exitIpFromBrowser = body.trim();
      }
    } catch {
      exitIpFromBrowser = null;
    }
    return {
      language: navigator.language,
      languages: [...navigator.languages],
      timezone: tzInfo.timeZone,
      timezoneOffsetMin: new Date().getTimezoneOffset(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      webglVendor: gl.vendor,
      webglRenderer: gl.renderer,
      screenWidth: screen.width,
      screenHeight: screen.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      exitIpFromBrowser,
    };
  });
}

/**
 * Reverse-geocode an IP via ipapi.co's free tier. Rate-limited
 * (~1k req/day per source IP) — returns nulls on any failure rather
 * than throwing, so the probe still emits a structured result.
 */
export async function lookupGeo(ip: string): Promise<IpGeoLookup> {
  try {
    const r = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { "user-agent": "browser-probes-geoip/0.1" },
    });
    if (!r.ok) {
      return { ip, country: null, region: null, city: null, timezone: null };
    }
    const j = (await r.json()) as {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
    return {
      ip,
      country: j.country ?? null,
      region: j.region ?? null,
      city: j.city ?? null,
      timezone: j.timezone ?? null,
    };
  } catch {
    return { ip, country: null, region: null, city: null, timezone: null };
  }
}
