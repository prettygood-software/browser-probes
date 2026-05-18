# Agent Instructions

Instructions for AI coding agents working on `ts-cli-template`-derived projects.

## Code Style

```yaml
Language: TypeScript (strict)
Runtime: Bun
CLI framework: citty (UnJS)
Logging: pino (+ pino-pretty in TTY)
Modules: ESM
Errors: throw CliError with code + exitCode; catch at the top-level in cli.ts
```

## Getting Started

```bash
export NODE_AUTH_TOKEN=$(gh auth token)   # needs read:packages scope
mise install
bun install
./scripts/setup-hooks.sh
bun run dev hello
bun run check
```

## Directory Conventions

| Type            | Location                                              |
| --------------- | ----------------------------------------------------- |
| Entry point     | `src/cli.ts` (shebang)                                |
| Commands        | `src/commands/<name>.ts` — one citty command per file |
| Business logic  | `src/<domain>/index.ts`                               |
| Logger          | `src/logger/index.ts`                                 |
| Typed errors    | `src/errors/index.ts`                                 |
| Tests (unit)    | `*.test.ts` next to source                            |
| Tests (e2e CLI) | `test/cli.test.ts` — spawns the binary                |

## Adding a Command

1. Create `src/commands/<name>.ts` exporting a `defineCommand({...})`
2. Register under `subCommands` in `src/cli.ts`
3. Put domain logic in `src/<domain>/index.ts` (not in the command)
4. Add unit tests for the logic; add an e2e test in `test/cli.test.ts`

## Scripts

```bash
bun run dev <args>     # run cli.ts directly without build
bun run build          # bundle to dist/cli.js (Bun-targeted)
bun run build:binary   # bun build --compile → single-file binary dist/hello-cli
bun test               # all tests
bun run check          # typecheck + lint + format + spell + test
```

## Error Handling

- Don't `process.exit` outside `src/cli.ts`. Throw `CliError` with a code and `exitCode`.
- `src/cli.ts` is the only place that converts `CliError` → exit code + stderr message.
- Unexpected errors bubble up (uncaught) → non-zero exit with stack trace.

## i18n

- Keys live in `src/greeting/languages.ts` (`as const` object). Adding a language is one entry there.
- `isSupportedLanguage` is the type guard at the CLI boundary.

## Avoid

- `any` (use `unknown` and narrow)
- Default exports
- `process.exit` in domain logic
- Writing directly to `console.log` — use `process.stdout.write` for user output, `logger` for diagnostics
- Untested branches
