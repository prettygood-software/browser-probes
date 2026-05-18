import { describe, expect, test } from "bun:test";

import { greet, isSupportedLanguage, supportedLanguages } from "./index.ts";

describe("greet", () => {
  test("defaults to English 'Hello, World!'", () => {
    expect(greet({})).toBe("Hello, World!");
  });

  test("uses provided name", () => {
    expect(greet({ name: "Alice" })).toBe("Hello, Alice!");
  });

  test("translates to Spanish", () => {
    expect(greet({ name: "Carlos", language: "es" })).toBe("Hola, Carlos!");
  });

  test("prefixes emoji when emoji=true", () => {
    expect(greet({ name: "Alice", emoji: true })).toBe("👋 Hello, Alice!");
  });

  test.each([...supportedLanguages])("returns non-empty string for language %s", (lang) => {
    expect(greet({ name: "X", language: lang })).toMatch(/^\S+, X!$/u);
  });
});

describe("isSupportedLanguage", () => {
  test("returns true for supported codes", () => {
    expect(isSupportedLanguage("en")).toBe(true);
    expect(isSupportedLanguage("ja")).toBe(true);
  });

  test("returns false for unsupported codes", () => {
    expect(isSupportedLanguage("xx")).toBe(false);
    expect(isSupportedLanguage("")).toBe(false);
  });
});
