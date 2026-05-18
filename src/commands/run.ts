import "dotenv/config";

import { writeFile } from "node:fs/promises";

import {
  type EngineName,
  type ProxyConfig,
  proxyConfigFromEnv,
} from "@prettygood-software/site-runner/browser";
import { defineCommand } from "citty";

import { ProbeError, unknownProbe } from "../errors/index.ts";
import { createLogger } from "../logger/index.ts";
import { formatJson, formatPretty } from "../output.ts";
import { getProbe, probes } from "../probes/index.ts";
import { runProbe } from "../runner.ts";
import type { RunProbeOptions } from "../types.ts";

const KNOWN_ENGINES: readonly EngineName[] = ["camoufox", "chromium", "cloakbrowser"];

function parseEngine(raw: string): EngineName {
  if (!(KNOWN_ENGINES as readonly string[]).includes(raw)) {
    throw new Error(`Unknown engine '${raw}'. Known: ${KNOWN_ENGINES.join(", ")}`);
  }
  return raw as EngineName;
}

export const runCommand = defineCommand({
  meta: {
    name: "run",
    description: "Run a probe against a launched browser",
  },
  args: {
    probe: {
      type: "positional",
      description: "Probe name (see `browser-probe list`)",
      required: true,
    },
    engine: {
      type: "string",
      description: `Browser engine (${KNOWN_ENGINES.join(", ")})`,
      default: "camoufox",
    },
    // Define this as the positive `proxy` flag (default true) and let
    // citty's --no-X negation produce `--no-proxy`. Declaring `no-proxy`
    // as its own arg makes citty silently treat the literal `--no-proxy`
    // input as the negation of an undeclared `proxy` flag, which left
    // args["no-proxy"] stuck at its default of false. v0.1.0 shipped
    // with that bug masked by resolveProxy returning null on missing env.
    proxy: {
      type: "boolean",
      description: "Use the env-configured proxy. Pass --no-proxy for an engine-only baseline.",
      default: true,
    },
    country: {
      type: "string",
      description: "Override the proxy country code (e.g. 'pl', 'de')",
    },
    json: {
      type: "boolean",
      description: "Emit machine-readable JSON instead of pretty text",
      default: false,
    },
    output: {
      type: "string",
      description: "Also persist JSON report to this path",
    },
    timeout: {
      type: "string",
      description: 'Abort the probe after N seconds (post-launch). Throws ProbeError("timeout").',
    },
  },
  async run({ args }) {
    const probe = getProbe(args.probe);
    if (!probe) {
      throw unknownProbe(
        args.probe,
        probes.map((p) => p.name),
      );
    }
    const engine = parseEngine(args.engine);
    const proxy = resolveProxy({ noProxy: !args.proxy, country: args.country });
    const timeoutMs = parseTimeout(args.timeout);
    const logger = createLogger({ level: "info", format: "pretty" });

    const opts: RunProbeOptions = { engine, proxy, logger };
    if (timeoutMs !== undefined) opts.timeoutMs = timeoutMs;
    const report = await runProbe(probe, opts);

    const json = JSON.stringify(report, null, 2);
    if (args.output) {
      await writeFile(args.output, `${json}\n`);
      process.stderr.write(`Wrote ${args.output}\n`);
    }
    if (args.json) {
      process.stdout.write(formatJson(report));
      return;
    }
    process.stdout.write(formatPretty(report, probe));
  },
});

interface ProxyArgs {
  noProxy: boolean;
  country: string | undefined;
}

function resolveProxy({ noProxy, country }: ProxyArgs): ProxyConfig | null {
  if (noProxy) return null;
  const base = proxyConfigFromEnv();
  if (!base) {
    // Proxy is the default; missing env is a usage error, not a silent
    // fallback. The old behavior returned null here, which made
    // `browser-probe run creepjs` silently behave as `--no-proxy` and
    // misled diagnostics. Be explicit instead.
    throw new ProbeError(
      "proxy_required",
      "PROXY_USERNAME/PROXY_PASSWORD/PROXY_BACKCONNECT_HOST/PROXY_BACKCONNECT_PORT not in env. Pass --no-proxy for an engine-only baseline.",
    );
  }
  return country === undefined ? base : { ...base, country };
}

function parseTimeout(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new ProbeError(
      "invalid_timeout",
      `--timeout must be a positive number of seconds, got "${raw}"`,
    );
  }
  return Math.round(seconds * 1000);
}
