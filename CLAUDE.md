# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartSpace Chat UI — a React 18.3 + TypeScript chat interface built with Vite, designed to integrate with the SmartSpace.ai backend. Uses TanStack Router (file-based routing), TanStack Query for server state, MSAL/Teams auth, and SignalR for real-time updates.

## Commands

| Task                | Command                |
| ------------------- | ---------------------- |
| Install deps        | `pnpm install`         |
| Dev server          | `pnpm run serve`       |
| Dev with .env.local | `pnpm run start:local` |
| Dev with .env.dev   | `pnpm run start:dev`   |
| Build               | `pnpm run build`       |
| Test                | `pnpm test`            |
| Lint (quiet)        | `pnpm run lint`        |
| Lint (full)         | `pnpm run lint:all`    |
| Lint fix            | `pnpm run lint:fix`    |
| Typecheck           | `pnpm run typecheck`   |
| Teams manifest      | `pnpm run build:teams` |

Run a single test file: `pnpm exec vitest run src/path/to/file.spec.ts`

Package manager: **pnpm** (pinned via `packageManager` field in `package.json`, resolved by Corepack). Do not use `npm install` — it creates `package-lock.json` and causes lockfile drift.

CI pipeline runs: `pnpm run lint:all` → `pnpm run typecheck` → `pnpm test` → `pnpm run build`

## Architecture

### Layered Architecture (enforced by ESLint boundaries plugin)

```
src/
├── platform/     # Foundational: API client, auth (MSAL/Teams), SignalR, router
├── app/          # Root providers, composition — imports everything
├── domains/      # Feature logic: queries, mutations, models, mappers, services
├── forms/        # Validation + server error mapping
├── theme/        # Design tokens, MUI theme bridge, CSS variables
├── ui/           # Feature UI components — consumes domains + theme
├── pages/        # Full-page components — consumes ui + domains
├── shared/       # Pure utilities, hooks, UI primitives — no feature deps
├── routes/       # TanStack Router file-based route definitions (auto-generates routeTree.gen.ts)
└── assets/       # Static files (logos, icons)
```

**Dependency rules** (violations cause lint errors):

- `platform` → cannot import app, domains, theme, ui, pages
- `domains` → only platform + shared
- `shared` → cannot import app, domains, theme, ui, pages
- `ui` → platform, shared, domains, forms, theme (no pages)
- `pages` → ui, domains, platform, shared, forms, theme

### Domain Pattern

Each domain (`src/domains/<feature>/`) follows:

- `model.ts` — TypeScript interfaces
- `schemas.ts` — Zod validation
- `service.ts` — API calls
- `mapper.ts` — DTO ↔ model transformation
- `queries.ts` / `mutations.ts` — TanStack Query hooks
- `queryKeys.ts` — Query key factories

**Import restriction**: Outside code must import from domain index (models/queries/mutations), not DTO/mapper/service directly.

### Authentication

Dual-mode auth via `AuthAdapter` interface:

- **MsalWebAdapter** (`src/platform/auth/providers/msalWeb.ts`) — MSAL popup/redirect for browser and Teams with MSAL flag
- **TeamsNaaAdapter** (`src/platform/auth/providers/teamsNaa.ts`) — Teams Native App Authentication (SSO)
- Runtime detection in `src/platform/auth/runtime.ts`; adapter selected in `src/platform/auth/session.tsx`
- `VITE_TEAMS_USE_MSAL=true` forces MSAL in Teams (cross-tenant scenarios)

### API Layer

- `@smartspace/api-client` npm package provides the typed API client
- Request interceptor attaches Bearer tokens silently
- Do **not** import `axios` outside `src/platform/` (lint error)

### Routing

- TanStack Router with file-based routes — `src/routes/` auto-generates `routeTree.gen.ts`
- Protected routes under `/_protected` layout (session/token validation)
- Route context provides `QueryClient` and API instance

### Real-time

- SignalR via `RealtimeProvider`, mounted only when session exists

## Code Style Rules

- **No `any`** — `@typescript-eslint/no-explicit-any: error`
- **No non-null assertions** — `@typescript-eslint/no-non-null-assertion: error`
- **No raw hex colors** in app code — use semantic tokens from `@/theme`
- **No px font sizes** — use rem via theme typography tokens
- **No inline transitions** — use motion tokens from `@/theme/tokens/motion`
- **Import ordering enforced**: builtin → external → internal (alphabetized, with newlines between groups)
- Path alias: `@/*` → `src/*`
- **Prettier**: single quotes
- Unused vars prefixed with `_` are allowed

## Environment Variables

```
VITE_CLIENT_ID=              # Entra ID client ID
VITE_CLIENT_AUTHORITY=       # https://login.microsoftonline.com/{tenantId}
VITE_CLIENT_SCOPES=          # Comma-separated scopes
VITE_CHAT_API_URI=           # SmartSpace API endpoint
VITE_TEAMS_USE_MSAL=true     # Optional: force MSAL in Teams
PUBLIC_ORIGIN=               # Optional: tunnel URL for Teams dev
```

## Tech Stack

React 18.3, TypeScript 5.5, Vite 5, TanStack Router + Query, MSAL Browser, Teams JS SDK, MUI 6, Tailwind CSS 3, shadcn/ui, Zod, SignalR, Milkdown (markdown editor), Vitest, Nx (workspace orchestrator)
