import { defineCommand } from "citty";

import { unsupportedLanguage } from "../errors/index.ts";
import {
  greet,
  isSupportedLanguage,
  type LanguageCode,
  supportedLanguages,
} from "../greeting/index.ts";

export const greetCommand = defineCommand({
  meta: {
    name: "greet",
    description: "Greet a specific person, optionally in another language",
  },
  args: {
    name: {
      type: "string",
      description: "Name to greet",
      required: true,
    },
    lang: {
      type: "string",
      description: `Language code (${supportedLanguages.join(", ")})`,
      default: "en",
    },
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
    "list-languages": {
      type: "boolean",
      description: "List supported language codes and exit",
      default: false,
    },
  },
  run({ args }) {
    if (args["list-languages"]) {
      process.stdout.write(`${supportedLanguages.join("\n")}\n`);
      return;
    }
    if (!isSupportedLanguage(args.lang)) {
      throw unsupportedLanguage(args.lang, supportedLanguages);
    }
    const language: LanguageCode = args.lang;
    const message = greet({ name: args.name, language, emoji: args.emoji });
    if (args.json) {
      process.stdout.write(`${JSON.stringify({ message, language })}\n`);
      return;
    }
    process.stdout.write(`${message}\n`);
  },
});
