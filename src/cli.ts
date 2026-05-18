#!/usr/bin/env bun
import { type CommandDef, defineCommand, runCommand as runCittyCommand, showUsage } from "citty";

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

// citty's runMain handles --help / --version / no-args by calling showUsage,
// but its catch block downgrades every thrown error to exit code 1 — that
// would lose the custom exitCode on CliError (e.g. 2 for "unknown probe").
// So we dispatch manually: handle the meta flags with showUsage, otherwise
// hand off to runCommand and keep our CliError → exitCode mapping intact.
const rawArgs = process.argv.slice(2);

try {
  if (rawArgs.length === 0 || rawArgs.includes("--help") || rawArgs.includes("-h")) {
    const [cmd, parent] = await resolveSubCommand(main, rawArgs);
    await showUsage(cmd, parent);
    process.exit(0);
  }
  if (rawArgs.length === 1 && (rawArgs[0] === "--version" || rawArgs[0] === "-v")) {
    process.stdout.write(`${VERSION}\n`);
    process.exit(0);
  }
  await runCittyCommand(main, { rawArgs });
} catch (error) {
  if (error instanceof CliError) {
    process.stderr.write(`error: ${error.message}\n`);
    process.exit(error.exitCode);
  }
  throw error;
}

async function resolveSubCommand(
  cmd: CommandDef,
  args: readonly string[],
  parent?: CommandDef,
): Promise<[CommandDef, CommandDef | undefined]> {
  // The citty type says subCommands is non-nullable but most commands
  // define no subtree — guard explicitly.
  const subCommands = (await resolve(cmd.subCommands)) as Record<string, unknown> | undefined;
  if (!subCommands || Object.keys(subCommands).length === 0) return [cmd, parent];
  const positionalIdx = args.findIndex((a) => !a.startsWith("-"));
  const subName = positionalIdx === -1 ? undefined : args[positionalIdx];
  if (subName === undefined) return [cmd, parent];
  // eslint-disable-next-line security/detect-object-injection
  const sub = subCommands[subName];
  if (!sub) return [cmd, parent];
  const resolved = await resolve(sub);
  return resolveSubCommand(resolved, args.slice(positionalIdx + 1), cmd);
}

async function resolve<T>(value: T | (() => T | Promise<T>) | Promise<T> | undefined): Promise<T> {
  if (typeof value === "function") {
    return (value as () => T | Promise<T>)();
  }
  return value as T;
}
