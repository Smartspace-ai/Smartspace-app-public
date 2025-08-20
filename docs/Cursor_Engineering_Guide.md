# Cursor Engineering Guide

This guide is designed to be referenced by Cursor during code changes in the Smartspace UI-v2 migration.

---

## Feature-First Architecture
- `platform/`: theme, router, api, providers
- `shared/`: components, utils, types
- `features/`: messages, comments, workspaces, etc.
- One-way imports: platform → features → shared
- Rule of thumb: a feature never imports another feature (share via `shared/`).

## Routing
- **TanStack Router** with typed routes
- Params: `workspaceId`, `threadId`
- Search state: filters, drawer open/close
- Use loaders: route won't resolve until data is ready, but show **Loading UI** skeletons meanwhile

## Data Layer
- **React Query** for async state
- **Zod** schemas for runtime validation of server responses
- Each feature has:
  - `service.ts` → API calls + Zod validation
  - `queryKeys.ts` → central query key definitions
  - `hooks.ts` → React Query hooks
- Global error boundary + toast for query errors
- Use MSW for mocking API calls in tests

## UI & Theming
- **MUI v5** with custom theme setup
- Tokens: `light`, `dark`, (future Teams override)
- Responsive breakpoints (`xs`, `sm`, `md`, `lg`)
- Drawer responsive behavior: modal on mobile, persistent on desktop
- Stick to MUI primitives; wrap custom `shared/components` for common UI

## Testing
- **Vitest** for fast tests
- **React Testing Library (RTL)** for DOM interaction tests
- **MSW** for network mocking
- Use `renderWithApp` helper to wrap providers (Router, QueryClient, Theme)
- File placement: `*.test.tsx` next to the component
- Types of tests:
  - **Unit**: small components and utils
  - **Integration**: a feature flow (e.g., send a message)
  - **Contract**: Zod schemas validate mocked responses

## PR & Commit Workflow
- Branch naming: `feat/...`, `fix/...`, `chore/...`
- **Conventional commits**:
  - `feat: add workspace drawer`
  - `fix: handle query error`
  - `chore: setup vitest`
- **PR template** should include:
  - Context / description
  - Screenshots or GIFs (for UI)
  - Checklist (types, tests, docs updated)
- Track merged PRs in `docs/PROGRESS.md`

## Definition of Done
- Type-safe code compiles
- Zod validation applied
- Theming + responsiveness checked
- Tests added or stubs created if deferred
- `docs/PROGRESS.md` entry added

---
