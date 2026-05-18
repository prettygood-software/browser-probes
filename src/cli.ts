#!/usr/bin/env bun
import { defineCommand, runCommand as runCittyCommand } from "citty";

import { listCommand } from "./commands/list.ts";
import { runCommand } from "./commands/run.ts";
import { CliError } from "./errors/index.ts";
import { NAME, VERSION } from "./version.ts";

const main = defineCommand({
  meta: {
    name: NAME,
    version: VERSION,
    description: "Composable browser-diagnostic probes (CreepJS, GeoIP coherence).",
  },
  subCommands: {
    list: listCommand,
    run: runCommand,
  },
});

try {
  await runCittyCommand(main, { rawArgs: process.argv.slice(2) });
} catch (error) {
  if (error instanceof CliError) {
    process.stderr.write(`error: ${error.message}\n`);
    process.exit(error.exitCode);
  }
  throw error;
}
