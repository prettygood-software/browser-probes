import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

const CREEPJS_REPO = "https://github.com/abrahamjuliot/creepjs.git";

/**
 * Resolve the vendor directory relative to the consumer's CWD — NOT the
 * SDK install location. The vendor clone is bulky (~50MB) and pinning it
 * inside node_modules would break on reinstall. Consumers gitignore
 * `vendor/` (or override via env later if needed).
 */
export function creepjsVendorDir(): string {
  return path.resolve(process.cwd(), "vendor/creepjs");
}

export function creepjsDocsDir(): string {
  return path.join(creepjsVendorDir(), "docs");
}

export function ensureCreepJsClone(): void {
  const dir = creepjsVendorDir();
  if (existsSync(dir)) return;
  process.stderr.write(`vendor/creepjs/ missing — cloning ${CREEPJS_REPO}...\n`);
  // Resolved via $PATH on purpose — pinning a /usr/bin/git would break on
  // distros that ship git elsewhere (mise shims, nix profiles, Homebrew on
  // Apple silicon). The args are static; the only attacker-controlled
  // input is the clone target dir, which is bounded to the consumer's CWD.
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  const result = spawnSync("git", ["clone", "--depth", "1", CREEPJS_REPO, dir], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(
      `git clone of ${CREEPJS_REPO} into ${dir} failed (exit ${String(result.status)})`,
    );
  }
}

export async function ensureCreepJsBundle(): Promise<void> {
  const bundle = path.join(creepjsDocsDir(), "creep.js");
  try {
    await stat(bundle);
  } catch {
    throw new Error(
      `Expected ${bundle} (CreepJS prebuilt bundle) not found. Remove vendor/creepjs and rerun to re-clone.`,
    );
  }
}
