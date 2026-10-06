# Contributing

This file is for working on the template itself. If you are deploying your own branded interface, [Readme.md](Readme.md) is the one you want.

## Setup

Node.js 20+ and pnpm 9. `corepack enable` resolves the version pinned in `package.json`. The repo blocks other package managers through a `preinstall` hook, so `npm install` will refuse rather than produce a second lockfile.

```bash
pnpm install
```

## Scripts

| Script                               | What it does                                                               |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `pnpm run serve`                     | Dev server. Vite reads `.env` from the project root.                       |
| `pnpm run start`                     | Dev server **and** a public dev tunnel, together.                          |
| `pnpm run start:local` / `start:dev` | Dev server against `.env.local` / `.env.dev`.                              |
| `pnpm run build`                     | Production build.                                                          |
| `pnpm run test`                      | Tests.                                                                     |
| `pnpm run lint`                      | Lint, errors only. `lint:all` includes warnings, `lint:fix` applies fixes. |
| `pnpm run typecheck`                 | Types, no emit.                                                            |
| `pnpm run check:theme`               | Checks the app theme against the one in `packages/chat-ui`.                |
| `pnpm run build:teams`               | Generates `teams/manifest.json` and `teams/smartspace.zip`.                |

The `:dev` and `:local` variants of build and test exist too, each pointing at the matching env file.

## Dev tunnels

When something outside your machine needs to reach the dev server — a Teams manifest, an auth callback — use **Microsoft Dev Tunnels** via the `devtunnel` CLI:

```bash
pnpm run start:tunnel        # against .env.local
pnpm run start:tunnel:dev    # against .env.dev
```

Set these in `.env.local` or `.env.dev`:

- `PUBLIC_ORIGIN` — the tunnel URL. Its hostname feeds Vite's `server.allowedHosts`.
- `TUNNEL_ID` — optional but recommended. Reusing an existing tunnel id keeps the URL stable across restarts, e.g. `puzzled-chair-8bzd2hr.aue`.

## Documentation

Two files are published to customers, and one of them is live:

- **`Readme.md`** is fetched at runtime by the SmartSpace admin interface and rendered on its API documentation page. **Merging a change to it publishes that change to every installation**, with no release gate. Review it accordingly.
- That page replaces the whole fenced `env` block in this file with values from the reader's own installation. Keep exactly one such block, and keep explanatory text **outside** it — anything inside is discarded before the reader sees it.
- **`teams/Readme.md`** is linked from the main guide and read by anyone setting up Teams.

## Pull requests

1. Branch from `develop`.
2. Make the change, with tests where there is behaviour to pin.
3. `pnpm run lint && pnpm run typecheck && pnpm run test`.
4. Open a pull request against `develop` describing what changed and why.

Releases reach `main` through the standing `develop → main` pull request, and tags are cut to match SmartSpace versions.

## License

MIT. See [LICENSE](LICENSE).
