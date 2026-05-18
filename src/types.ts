import type {
  BrowserHandle,
  EngineName,
  ProxyConfig,
} from "@prettygood-software/site-runner/browser";
import type { BrowserFingerprint } from "@prettygood-software/site-runner/browser/fingerprint";
import type { Logger } from "pino";

export interface ProbeContext {
  browser: BrowserHandle;
  logger?: Logger;
  cleanups: (() => Promise<void>)[];
  /** Where the probe can persist intermediate artifacts. */
  scratchDir: string;
}

export interface Probe<TResult extends object> {
  /** Stable identifier — also the CLI subcommand name. */
  name: string;
  /** One-line description for --help. */
  description: string;
  /** Run against a launched browser. Pure data return, no I/O side effects beyond scratchDir. */
  run(ctx: ProbeContext): Promise<TResult>;
  /** Optional pretty formatter — fallback is JSON.stringify(result, null, 2). */
  format?(result: TResult): string;
}

export interface ProbeReport<TResult extends object> {
  probe: string;
  engine: EngineName;
  proxyEnabled: boolean;
  exitIp: string | null;
  durationMs: number;
  recordedAt: string;
  result: TResult;
}

export interface RunProbeOptions {
  engine?: EngineName;
  /** `null` disables the proxy; `undefined` falls back to `proxyConfigFromEnv()`. */
  proxy?: ProxyConfig | null;
  fingerprint?: BrowserFingerprint;
  logger?: Logger;
  /** Override the default profile-dir mktemp. */
  profileDir?: string;
  /**
   * Abort the probe (NOT the browser launch) if `probe.run` doesn't return
   * within this many milliseconds. Throws `ProbeError("timeout", ...)`;
   * the runner still tears down the browser and tempdirs in the finally
   * block, so a timeout never leaks a Playwright subprocess.
   */
  timeoutMs?: number;
}

export {
  type BrowserHandle,
  type EngineName,
  type ProxyConfig,
} from "@prettygood-software/site-runner/browser";
export { type BrowserFingerprint } from "@prettygood-software/site-runner/browser/fingerprint";
