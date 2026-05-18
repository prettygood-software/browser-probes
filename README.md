# browser-probes

Composable browser-diagnostic probes (CreepJS, GeoIP coherence) on top of
[`@prettygood-software/site-runner`](https://github.com/prettygood-software/site-runner).
CLI + programmatic. Use it to sanity-check a stealth setup before burning live
SMS slots: does Camoufox still pass as a real browser? Did a config change
break fingerprint coherence?

## Install

Published to GitHub Packages (restricted). Consumers need a `.npmrc` that
points the `@prettygood-software` scope at the GitHub registry plus a token
with `read:packages`:

```
# .npmrc (consumer)
@prettygood-software:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```sh
export NODE_AUTH_TOKEN=$(gh auth token)
bun add @prettygood-software/browser-probes
```

## CLI

```sh
browser-probe list                              # built-in probes (name, description)
browser-probe run creepjs                       # default opts (camoufox, env proxy)
browser-probe run creepjs --engine chromium
browser-probe run creepjs --no-proxy
browser-probe run geoip --json --output /tmp/x.json
browser-probe run creepjs --country de          # override proxy exit country
browser-probe --help
```

`run` flags:

| Flag         | Default        | Effect                                         |
| ------------ | -------------- | ---------------------------------------------- |
| `--engine`   | `camoufox`     | One of `camoufox`, `chromium`, `cloakbrowser`. |
| `--no-proxy` | off (proxy on) | Skip the env-configured proxy.                 |
| `--country`  | proxy default  | Override the proxy exit country (e.g. `pl`).   |
| `--json`     | pretty         | Emit machine-readable JSON.                    |
| `--output`   | stdout only    | Also persist JSON report to the given path.    |

Proxy is configured from the standard site-runner env vars: `PROXY_USERNAME`,
`PROXY_PASSWORD`, `PROXY_BACKCONNECT_HOST`, `PROXY_BACKCONNECT_PORT`. A
`.env` in the consumer's CWD is auto-loaded via `dotenv/config`.

## Programmatic

```ts
import { runProbe, creepjsProbe, geoipProbe } from "@prettygood-software/browser-probes";

const report = await runProbe(creepjsProbe, {
  engine: "camoufox",
  // proxy: null,   // disable
  // proxy: { host, port, username, password, country: "pl" },
});

console.log(report.result.fpId, report.result.headless);
console.log("exit IP:", report.exitIp, "elapsed:", report.durationMs, "ms");
```

The runner owns the browser lifecycle: it mktemps a profile + scratch dir,
launches the engine through site-runner with `humanize: "off"`, runs the
probe, and tears everything down (LIFO cleanups, then `browser.close()`,
then `rm` on the tempdirs).

## Built-in probes

| Probe     | What it checks                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `creepjs` | Self-hosted CreepJS fingerprint test. Surfaces FP ID + headless markers (`chromium`, `like headless`, `headless`, `stealth`). |
| `geoip`   | Cross-checks browser fingerprint (locale, timezone) against the proxy's exit-IP geolocation via ipapi.co.                     |

`creepjs` auto-clones the CreepJS repo into `vendor/creepjs/` under the
consumer's CWD on first run (~50MB, gitignored). The local HTTP server runs
on `127.0.0.1`; the runner sets `ProxyConfig.bypass = "127.0.0.1,localhost"`
so the page loads through the consumer's loopback while everything else
still routes through the proxy.

`geoip` does a free reverse-geocode via ipapi.co — rate-limited (~1k req/day
per source IP) and may return nulls if the limit is hit. The probe never
throws on geocode failure; it emits `geo: null` and `verdict: null`.

## Engine matrix

| Engine         | `creepjs`                               | `geoip` |
| -------------- | --------------------------------------- | ------- |
| `camoufox`     | ✅ preferred                            | ✅      |
| `chromium`     | ⚠️ no `proxy.bypass` wired in shared.ts | ✅      |
| `cloakbrowser` | ⚠️ no `proxy.bypass` wired in shared.ts | ✅      |

The CDP-family engines (chromium, cloakbrowser) don't yet honor
`ProxyConfig.bypass` — the gap is in site-runner's `shared.ts:spawnChrome`,
which needs `--proxy-bypass-list` wiring. Until then, `creepjs` with a
proxy on a CDP engine will fail to load the local server. Camoufox handles
bypass via Playwright's launch options and works end-to-end.

## v0.2.0

Snapshot / budget layer (pinning expected FP IDs, asserting headless markers
stay at 0%, surfacing diffs across runs) is on the roadmap. Not in v0.1.

## License

MIT.
