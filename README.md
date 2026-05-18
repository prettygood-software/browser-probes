# ts-cli-template

TypeScript CLI template powered by [Bun](https://bun.sh) and [citty](https://github.com/unjs/citty). Strict TS, pino logging, i18n, typed errors, and a single-binary build via `bun build --compile`.

Mirrors the structure of [`go-cli-template`](https://github.com/MOlechowski/go-cli-template).

## Stack

| Concern                                           | Tool                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Runtime / package manager / bundler / test runner | Bun                                                                                  |
| CLI framework                                     | [citty](https://github.com/unjs/citty) (UnJS)                                        |
| Logging                                           | [pino](https://github.com/pinojs/pino) + pino-pretty                                 |
| Shared configs                                    | [`@prettygood-software/ts-config`](https://github.com/prettygood-software/ts-config) |
| Toolchain version manager                         | [mise](https://mise.jdx.dev)                                                         |
| Git hooks                                         | [lefthook](https://lefthook.dev)                                                     |
| Commit lint                                       | [cocogitto](https://docs.cocogitto.io) (`cog`)                                       |
| Changelog                                         | [Changie](https://github.com/miniscruff/changie)                                     |
| CI                                                | GitHub Actions                                                                       |

## Quick start

This template installs `@prettygood-software/ts-config` from GitHub Packages. Set `NODE_AUTH_TOKEN` first:

```bash
export NODE_AUTH_TOKEN=$(gh auth token)   # gh token needs read:packages
mise install                              # bun, lefthook, cog, actionlint, changie
bun install
./scripts/setup-hooks.sh                  # lefthook git hooks
bun run dev hello                         # runs cli.ts directly
bun run check                             # typecheck + lint + format + spell + test
bun run build:binary                      # ./dist/hello-cli (single binary)
```

If your `gh` token lacks `read:packages`:

```bash
gh auth refresh -h github.com -s read:packages
```

## CLI examples

```bash
hello-cli hello                          # Hello, World!
hello-cli hello --emoji                  # 👋 Hello, World!
hello-cli greet --name Alice             # Hello, Alice!
hello-cli greet --name Carlos --lang es  # Hola, Carlos!
hello-cli greet --list-languages         # en, es, fr, de, ja, zh
hello-cli hello --json                   # {"message":"Hello, World!","language":"en"}
hello-cli version
hello-cli --debug greet --name Alice     # debug-level logs to stderr
hello-cli --log-format json hello        # JSON logger output
```

## Project structure

```
src/
├── cli.ts              # entry — registers subcommands and handles errors
├── commands/
│   ├── hello.ts
│   ├── greet.ts
│   └── version.ts
├── greeting/
│   ├── index.ts        # business logic
│   ├── languages.ts    # i18n table + type guard
│   └── greeting.test.ts
├── logger/
│   └── index.ts        # pino factory
├── errors/
│   ├── index.ts        # CliError + helpers
│   └── errors.test.ts
└── version.ts          # reads version from package.json
test/
└── cli.test.ts         # e2e tests — spawns the binary
```

## Using as a template

```bash
gh repo create my-cli --template prettygood-software/ts-cli-template --private
cd my-cli
./scripts/template-init.sh   # rewrite initial commit + tag v0.0.0
export NODE_AUTH_TOKEN=$(gh auth token)
mise install
bun install
./scripts/setup-hooks.sh
```

Then:

1. Rename `hello-cli` in `package.json` (`bin`)
2. Replace `src/greeting/` with your domain
3. Add commands under `src/commands/`

## License

MIT
