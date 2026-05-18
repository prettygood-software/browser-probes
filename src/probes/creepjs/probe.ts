import type { Probe, ProbeContext } from "../../types.ts";
import { scrapeCreepJs } from "./scrape.ts";
import { serverPort, startLocalServer } from "./server.ts";
import type { CreepJsResult } from "./types.ts";
import { creepjsDocsDir, ensureCreepJsBundle, ensureCreepJsClone } from "./vendor.ts";

export const creepjsProbe: Probe<CreepJsResult> = {
  name: "creepjs",
  description:
    "Self-hosted CreepJS bot-detection / fingerprint-coherence test. Surfaces headless markers + FP ID.",
  async run(ctx: ProbeContext): Promise<CreepJsResult> {
    ensureCreepJsClone();
    await ensureCreepJsBundle();

    const server = await startLocalServer(creepjsDocsDir());
    ctx.cleanups.push(
      () =>
        new Promise<void>((resolve) => {
          server.close(() => {
            resolve();
          });
        }),
    );

    const url = `http://127.0.0.1:${String(serverPort(server))}/`;
    ctx.logger?.info({ url }, "serving creepjs bundle");

    return scrapeCreepJs(ctx.browser.page, url);
  },
  format(result: CreepJsResult): string {
    const h = result.headless;
    const snippet = result.fullReport.slice(0, 1500);
    return (
      `  fingerprint ID:  ${result.fpId ?? "(missing)"}\n` +
      `  computed:        ${result.computed ? "yes" : "no (timed out, partial)"}\n` +
      `  chromium:        ${h.chromium ?? "(not found)"}\n` +
      `  like headless:   ${h.likeHeadless ?? "(not found)"}\n` +
      `  headless:        ${h.headless ?? "(not found)"}\n` +
      `  stealth:         ${h.stealth ?? "(not found)"}\n` +
      `\nFull report (first 1500 chars):\n${snippet}\n`
    );
  },
};
