import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  launchBrowser,
  type ProxyConfig,
  proxyConfigFromEnv,
} from "@prettygood-software/site-runner/browser";
import { countryProfile } from "@prettygood-software/site-runner/browser/fingerprint";

import type { Probe, ProbeContext, ProbeReport, RunProbeOptions } from "./types.ts";

const DEFAULT_BYPASS = "127.0.0.1,localhost";

export async function runProbe<TResult extends object>(
  probe: Probe<TResult>,
  opts: RunProbeOptions = {},
): Promise<ProbeReport<TResult>> {
  const engine = opts.engine ?? "camoufox";
  const proxy = resolveProxy(opts);
  const fingerprint = opts.fingerprint ?? (proxy ? countryProfile(proxy.country) : undefined);

  const ownsProfileDir = opts.profileDir === undefined;
  const profileDir = opts.profileDir ?? (await mkdtemp(path.join(tmpdir(), "browser-probe-prof-")));
  const scratchDir = await mkdtemp(path.join(tmpdir(), "browser-probe-scratch-"));

  const startedAt = new Date();
  const start = Date.now();

  const browser = await launchBrowser({
    engine,
    profileDir,
    proxy,
    ...(fingerprint ? { fingerprint } : {}),
    verifyExitIp: proxy !== null,
    humanize: "off",
  });

  const cleanups: (() => Promise<void>)[] = [];
  const ctx: ProbeContext = {
    browser,
    ...(opts.logger ? { logger: opts.logger } : {}),
    cleanups,
    scratchDir,
  };

  try {
    const result = await probe.run(ctx);
    return {
      probe: probe.name,
      engine,
      proxyEnabled: proxy !== null,
      exitIp: browser.exitIp,
      durationMs: Date.now() - start,
      recordedAt: startedAt.toISOString(),
      result,
    };
  } finally {
    // LIFO cleanup: probes push teardown for what they spun up; the runner
    // owns the outermost browser + tempdir teardown.
    for (const fn of [...cleanups].reverse()) {
      await fn().catch(() => null);
    }
    await browser.close().catch(() => null);
    if (ownsProfileDir) {
      await rm(profileDir, { recursive: true, force: true }).catch(() => null);
    }
    await rm(scratchDir, { recursive: true, force: true }).catch(() => null);
  }
}

function resolveProxy(opts: RunProbeOptions): ProxyConfig | null {
  if (opts.proxy === null) return null;
  const base = opts.proxy ?? proxyConfigFromEnv();
  if (!base) return null;
  // CreepJS and any other localhost-bound diagnostic needs the proxy to
  // bypass loopback. Decodo (and most data-center proxies) can't reach
  // the consumer's 127.0.0.1. Wired via ProxyConfig.bypass in
  // site-runner >= 1.4.0. Safe to set unconditionally; non-localhost
  // probes are unaffected.
  return { ...base, bypass: base.bypass ?? DEFAULT_BYPASS };
}
