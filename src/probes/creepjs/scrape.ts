import type { Page } from "playwright-core";

import type { CreepJsResult } from "./types.ts";

const SCRAPE_TIMEOUT_MS = 180_000;
const SETTLE_AFTER_COMPUTE_MS = 8000;
const SETTLE_AFTER_TIMEOUT_MS = 2000;

export async function scrapeCreepJs(page: Page, url: string): Promise<CreepJsResult> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // FP ID starts as "Computing..." and flips to a hash when the synchronous
  // fingerprint phase finishes. Async checks (audio, WebGL, etc.) keep
  // ticking past that, so settle further before scraping.
  // Playwright `waitForFunction` is (fn, arg, options) — the options bag
  // is the THIRD positional. Passing it as second slot makes it the
  // page-function argument and the default 30s timeout still applies.
  // Through a proxy the FP computation can run 45–90s. If it times out,
  // still scrape — partial reports diagnose proxy interference (e.g.
  // STUN-blocked WebRTC, slow headless probes).
  let computed = false;
  try {
    await page.waitForFunction(
      () => {
        const el = document.querySelector(".ellipsis-all");
        const text = el?.textContent ?? "";
        return text.startsWith("FP ID:") && !text.includes("Computing");
      },
      undefined,
      { timeout: SCRAPE_TIMEOUT_MS },
    );
    computed = true;
  } catch {
    process.stderr.write(
      "FP ID didn't compute in 180s (likely proxy interference with CreepJS async probes — STUN, fetch-based checks). Scraping partial state.\n",
    );
  }
  await page.waitForTimeout(computed ? SETTLE_AFTER_COMPUTE_MS : SETTLE_AFTER_TIMEOUT_MS);

  const scraped = await page.evaluate(() => {
    const root = document.querySelector("#fingerprint-data");
    const fullReport = root?.textContent ?? "";
    const fpIdText = document.querySelector(".ellipsis-all")?.textContent ?? null;

    // CreepJS's headless section uses lines like:
    //   chromium: false
    //   0% like headless: <hash>
    //   0% headless: <hash>
    //   0% stealth: <hash>
    // Percentage = detection confidence; lower is better.
    const lines = fullReport.split(/\r?\n/u).map((l) => l.trim());
    const findLine = (pattern: RegExp): string | null =>
      lines.find((line) => pattern.test(line)) ?? null;

    return {
      fullReport,
      fpId: fpIdText ? fpIdText.replace(/^FP ID:\s*/u, "").trim() : null,
      chromium: findLine(/^chromium:\s*/u),
      likeHeadless: findLine(/^\d+%\s*like\s*headless:/u),
      headless: findLine(/^\d+%\s*headless:/u),
      stealth: findLine(/^\d+%\s*stealth:/u),
    };
  });

  return {
    fpId: scraped.fpId,
    computed,
    headless: {
      chromium: scraped.chromium,
      likeHeadless: scraped.likeHeadless,
      headless: scraped.headless,
      stealth: scraped.stealth,
    },
    fullReport: scraped.fullReport,
  };
}
