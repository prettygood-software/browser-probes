import type { Probe, ProbeReport } from "./types.ts";

export function formatJson<T extends object>(report: ProbeReport<T>): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function formatPretty<T extends object>(
  report: ProbeReport<T>,
  probe: Pick<Probe<T>, "format"> = {},
): string {
  const header =
    `=== ${report.probe} (${report.engine}) ===\n` +
    `  proxy:      ${report.proxyEnabled ? "on" : "off"}\n` +
    `  exit IP:    ${report.exitIp ?? "(none)"}\n` +
    `  duration:   ${String(report.durationMs)}ms\n` +
    `  recorded:   ${report.recordedAt}\n`;
  const body = probe.format ? probe.format(report.result) : JSON.stringify(report.result, null, 2);
  return `${header}\n${body}\n`;
}
