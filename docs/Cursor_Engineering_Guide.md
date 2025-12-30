# Cursor Engineering Guide

This guide is designed to be referenced by Cursor during code changes in the Smartspace UI-v2 migration.

---

## Architecture

* **platform/** → theme, router, api client, envelopes, query client, providers, `useBreakpoint`
* **domains/** → schemas, service.ts (axios+Zod), queryKeys.ts, hooks. No JSX here.
* **ui/** → components and view-model hooks (VMs). Colocated, compositional only.
* **pages/** → route frames (map params/search → props → UI).
* **shared/** → small cross-cutting utils/components. No domain logic.
* **mocks/** → MSW handlers for dev & tests.
* **tests/** → test harness helpers (`renderWithApp`, setup, router, server).

### Import rules

* One-way imports: pages → ui → domains → shared → platform.
* No feature-to-feature imports. Use each domain’s public `index.ts`.
* Domain-specific error helpers must live in the domain (e.g., `domains/messages/errors.ts`).

---

## Routing

* **TanStack Router** with typed routes.
* **Params**: `workspaceId`, `threadId`.
* **Search state**: `panel`, `q`, `status`, `sort`, `tags`, `cursor`.
* Validate search with Zod.
* Use `useNavigate({ replace: true })` when updating debounced filters.

---

## Data Layer

* **React Query** for server state.
* **Zod** schemas for runtime validation at boundaries.
* Each domain contains:

  * `schemas.ts` → Zod schemas.
  * `service.ts` → API calls + Zod parse.
  * `queryKeys.ts` → central query key defs.
  * `use*.ts` → domain hooks.
* Errors: handled via domain `errors.ts`. Normalized via envelopes.
* Use MSW for mocking API calls in tests and demo mode.

---

## UI & Theming

* **MUI v5** with `tokens.ts` and `createMuiTheme.ts`.
* Light/dark themes (Teams override later).
* Responsive breakpoints: `{ xs, sm, md, lg, xl }`.
* **NavDrawer**: persistent on desktop, modal on mobile.
* **CommentsDrawer**: right drawer on desktop, bottom sheet on mobile.
* Stick to MUI primitives; override via theme not inline.

---

## View-Model (VM) Rules

* A VM is a colocated custom hook: `use<Component>VM.ts`.
* **Use a VM if:**

  * Multi-step/wizard logic.
  * Keyboard/gesture rules.
  * Optimistic updates or cache coordination.
  * Composes multiple domain hooks.
  * Derived/validated state beyond trivial.
* **Skip a VM if:**

  * Purely presentational component.
  * Trivial handlers only.
  * Small and obvious (< \~100 lines).
* **Testing impact:**

  * VM tests → unit test logic/state transitions.
  * Component tests → render states, a11y, wiring.

---

## Testing

* **Vitest** + **RTL** + **MSW**.
* Tests colocated: `*.test.tsx` next to code.
* Use `renderWithApp` helper for UI tests (wraps Theme/Router/QueryClient).
* Coverage target: **100% per-file**.
* Types of tests:

  * Unit: schemas, utils, small components.
  * Integration: feature flows (e.g., send message).
  * Contract: MSW handlers respect Zod schemas.

---

## PR & Commit Workflow

* Branch naming: `feat/...`, `fix/...`, `chore/...`.
* Conventional commits:

  * `feat(domain:messages): add optimistic send`
  * `fix(ui/threads): handle query error`
  * `chore(platform): setup vitest`
* PR template must include:

  * Context/description
  * Screenshots/GIFs if UI changes
  * Checklist: typecheck, lint, tests, docs updated
* Track merged PRs in `docs/PROGRESS.md`.

---

## Definition of Done

* Type-safe code compiles.
* Zod validation applied to all API responses.
* MUI theming and responsive behavior checked.
* Tests added (or stubs if deferred).
* `docs/PROGRESS.md` updated with PR line.
* Domain-specific error helpers scoped properly.
