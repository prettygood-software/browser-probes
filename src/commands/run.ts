import "dotenv/config";

import { writeFile } from "node:fs/promises";

import {
  type EngineName,
  type ProxyConfig,
  proxyConfigFromEnv,
} from "@prettygood-software/site-runner/browser";
import { defineCommand } from "citty";

import { unknownProbe } from "../errors/index.ts";
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
    "no-proxy": {
      type: "boolean",
      description: "Skip the env-configured proxy (engine-only baseline)",
      default: false,
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
    const proxy = resolveProxy({ noProxy: args["no-proxy"], country: args.country });
    const logger = createLogger({ level: "info", format: "pretty" });

    const opts: RunProbeOptions = { engine, proxy, logger };
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
  if (!base) return null;
  return country === undefined ? base : { ...base, country };
}
