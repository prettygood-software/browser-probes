import { defineCommand } from "citty";

import { probes } from "../probes/index.ts";

export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List built-in probes",
  },
  args: {
    json: {
      type: "boolean",
      description: "Emit JSON instead of plain text",
      default: false,
    },
  },
  run({ args }) {
    if (args.json) {
      const rows = probes.map((p) => ({ name: p.name, description: p.description }));
      process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
      return;
    }
    const nameWidth = Math.max(...probes.map((p) => p.name.length));
    for (const p of probes) {
      const padded = p.name.padEnd(nameWidth);
      process.stdout.write(`${padded}  ${p.description}\n`);
    }
  },
});
