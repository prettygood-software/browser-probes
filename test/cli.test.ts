import { describe, expect, test } from "bun:test";

const CLI = new URL("../src/cli.ts", import.meta.url).pathname;

async function runCli(
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", CLI, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { stdout, stderr, exitCode };
}

describe("cli", () => {
  test("hello prints default greeting", async () => {
    const { stdout, exitCode } = await runCli(["hello"]);
    expect(exitCode).toBe(0);
    expect(stdout).toBe("Hello, World!\n");
  });

  test("hello --emoji prefixes the wave", async () => {
    const { stdout, exitCode } = await runCli(["hello", "--emoji"]);
    expect(exitCode).toBe(0);
    expect(stdout).toBe("👋 Hello, World!\n");
  });

  test("hello --json emits JSON", async () => {
    const { stdout, exitCode } = await runCli(["hello", "--json"]);
    expect(exitCode).toBe(0);
    const parsed = JSON.parse(stdout) as { message: string; language: string };
    expect(parsed.message).toBe("Hello, World!");
    expect(parsed.language).toBe("en");
  });

  test("greet --name Alice --lang fr", async () => {
    const { stdout, exitCode } = await runCli(["greet", "--name", "Alice", "--lang", "fr"]);
    expect(exitCode).toBe(0);
    expect(stdout).toBe("Bonjour, Alice!\n");
  });

  test("greet --list-languages lists codes", async () => {
    const { stdout, exitCode } = await runCli(["greet", "--name", "x", "--list-languages"]);
    expect(exitCode).toBe(0);
    const codes = stdout
      .trim()
      .split("\n")
      .sort((a, b) => a.localeCompare(b));
    expect(codes).toEqual(["de", "en", "es", "fr", "ja", "zh"]);
  });

  test("greet with unsupported language exits 2", async () => {
    const { stderr, exitCode } = await runCli(["greet", "--name", "x", "--lang", "xx"]);
    expect(exitCode).toBe(2);
    expect(stderr).toContain('Unsupported language: "xx"');
  });

  test("version prints name and version", async () => {
    const { stdout, exitCode } = await runCli(["version"]);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/@prettygood-software\/ts-cli-template 0\.0\.0/u);
  });
});
