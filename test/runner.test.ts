/**
 * Runner smoke test — does NOT launch a real browser. Uses a mock Probe
 * that ignores ctx.browser and a stub site-runner.launchBrowser so the
 * test asserts on the runner's lifecycle + report shape in isolation.
 *
 * Real-engine probe tests are deferred to v0.2 (10s+ per case, needs
 * Camoufox binary present).
 */
import { describe, expect, mock, test } from "bun:test";

import type { Probe, ProbeContext, ProbeReport } from "../src/types.ts";

const closeMock = mock((): Promise<void> => Promise.resolve());
const launchMock = mock(() =>
  Promise.resolve({
    page: {},
    exitIp: "203.0.113.42",
    close: closeMock,
  }),
);

void mock.module("@prettygood-software/site-runner/browser", () => ({
  launchBrowser: launchMock,
  proxyConfigFromEnv: (): null => null,
}));
void mock.module("@prettygood-software/site-runner/browser/fingerprint", () => ({
  countryProfile: (): undefined => undefined,
}));

const { runProbe } = await import("../src/runner.ts");

interface MockResult {
  payload: string;
}

const mockProbe: Probe<MockResult> = {
  name: "mock",
  description: "test-only probe",
  run(ctx: ProbeContext): Promise<MockResult> {
    expect(ctx.browser.exitIp).toBe("203.0.113.42");
    expect(typeof ctx.scratchDir).toBe("string");
    expect(ctx.cleanups).toEqual([]);
    return Promise.resolve({ payload: "ok" });
  },
};

describe("runProbe", () => {
  test("returns a ProbeReport with the expected shape", async () => {
    closeMock.mockClear();
    const report: ProbeReport<MockResult> = await runProbe(mockProbe, { proxy: null });

    expect(report.probe).toBe("mock");
    expect(report.engine).toBe("camoufox");
    expect(report.proxyEnabled).toBe(false);
    expect(report.exitIp).toBe("203.0.113.42");
    expect(report.result).toEqual({ payload: "ok" });
    expect(typeof report.durationMs).toBe("number");
    expect(report.durationMs).toBeGreaterThanOrEqual(0);
    expect(report.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/u);

    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  test("respects the engine option", async () => {
    const report = await runProbe(mockProbe, { engine: "chromium", proxy: null });
    expect(report.engine).toBe("chromium");
  });

  test("runs registered cleanups in LIFO order before closing the browser", async () => {
    const order: string[] = [];
    closeMock.mockClear();
    closeMock.mockImplementation((): Promise<void> => {
      order.push("close");
      return Promise.resolve();
    });

    const probe: Probe<{ ok: true }> = {
      name: "cleanup-probe",
      description: "registers cleanups",
      run(ctx): Promise<{ ok: true }> {
        ctx.cleanups.push(
          () => {
            order.push("first");
            return Promise.resolve();
          },
          () => {
            order.push("second");
            return Promise.resolve();
          },
        );
        return Promise.resolve({ ok: true });
      },
    };

    await runProbe(probe, { proxy: null });
    expect(order).toEqual(["second", "first", "close"]);
  });
});
