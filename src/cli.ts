#!/usr/bin/env bun
import { defineCommand, runCommand } from "citty";

import { greetCommand } from "./commands/greet.ts";
import { helloCommand } from "./commands/hello.ts";
import { versionCommand } from "./commands/version.ts";
import { CliError } from "./errors/index.ts";
import { createLogger, type LogFormat, type LogLevel } from "./logger/index.ts";
import { NAME, VERSION } from "./version.ts";

const main = defineCommand({
  meta: {
    name: NAME,
    version: VERSION,
    description: "Hello-world CLI scaffolded from ts-cli-template",
  },
  args: {
    debug: {
      type: "boolean",
      description: "Enable debug logging",
      default: false,
    },
    "log-format": {
      type: "string",
      description: "Log format: pretty or json",
      default: "pretty",
    },
  },
  setup({ args }) {
    const level: LogLevel = args.debug ? "debug" : "info";
    const format: LogFormat = args["log-format"] === "json" ? "json" : "pretty";
    const logger = createLogger({ level, format });
    logger.debug({ args }, "CLI started");
  },
  subCommands: {
    hello: helloCommand,
    greet: greetCommand,
    version: versionCommand,
  },
});

try {
  await runCommand(main, { rawArgs: process.argv.slice(2) });
} catch (error) {
  if (error instanceof CliError) {
    process.stderr.write(`error: ${error.message}\n`);
    process.exit(error.exitCode);
  }
  throw error;
}
