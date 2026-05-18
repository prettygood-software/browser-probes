import type { Probe } from "../types.ts";
import { creepjsProbe } from "./creepjs/index.ts";
import { geoipProbe } from "./geoip/index.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProbe = Probe<any>;

export const probes: readonly AnyProbe[] = [creepjsProbe, geoipProbe];

export function getProbe(name: string): AnyProbe | undefined {
  return probes.find((p) => p.name === name);
}
