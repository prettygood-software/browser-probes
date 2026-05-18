import { defineCommand } from "citty";

import { greet } from "../greeting/index.ts";

export const helloCommand = defineCommand({
  meta: {
    name: "hello",
    description: "Print a hello-world greeting",
  },
  args: {
    emoji: {
      type: "boolean",
      description: "Prefix with a waving-hand emoji",
      default: false,
    },
    json: {
      type: "boolean",
      description: "Emit JSON instead of plain text",
      default: false,
    },
  },
  run({ args }) {
    const message = greet({ emoji: args.emoji });
    if (args.json) {
      process.stdout.write(`${JSON.stringify({ message, language: "en" })}\n`);
      return;
    }
    process.stdout.write(`${message}\n`);
  },
});
