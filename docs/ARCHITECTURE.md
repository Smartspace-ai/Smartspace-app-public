# Architecture Overview

This document describes the architecture for the Smartspace UI-v2 migration.

## Setup / OpenAPI

The app expects a generated API client and Zod schemas under `src/platform/api/generated/`. That folder is gitignored. Before first dev or build, run **`npm run openapi:generate`** (or **`npm run openapi:sync`** to fetch the spec and generate) if the generated files are missing.

## Layers

- **platform/** → Core setup: theming, router, api client, envelopes, providers.
- **domains/** → Per-feature data folders: messages, comments, workspaces, threads, etc. Contains schemas, queryKeys, service, hooks.
- **ui/** → Feature UI composition: components + optional VM hooks colocated.
- **pages/** → Route-level composition; map params/search → props → UI.
- **shared/** → Reusable components, utilities, types.
- **docs/** → PROGRESS.md, ARCHITECTURE.md, README.md
- **mocks/** → MSW handlers for local/dev/demo.
- **tests/** → Test helpers (`renderWithApp`, setup, router, server).

## Data Flow

1. **TanStack Router** manages routes, params, and search state.
2. **React Query** handles fetching and caching.
3. **Zod** validates server responses and enforces runtime safety.
4. **MUI Theme** provides a consistent design system with responsive breakpoints.

## Routing

- **File-based routes:** `src/routes/**`. Do not create a separate `src/router/` for route tree; the tree is generated.
- **Route tree:** Generated at `src/routeTree.gen.ts`; do not edit by hand. Built by the TanStack Router Vite plugin.
- **Root:** `src/routes/__root.tsx` defines the global layout shell and `<Outlet />`; root-level `errorComponent` and `pendingComponent` are set there.
- **Layouts:** `_protected` is the authenticated app shell; `workspace/$workspaceId/__layout` is the workspace-level layout.

## Rules

- Domains never import other domains directly.
- Shared code lives in `shared/` for cross-domain utilities.
- Keep queries colocated with their domain.
- Domain-specific error helpers must live inside that domain (e.g., `domains/messages/errors.ts`).
- Use MSW for consistent local/dev testing and demo mode.
- Use View-Model (VM) hooks only when justified (multi-step, optimistic updates, complex logic). Skip for trivial/presentational components.

## Example File Tree

```
platform/
  theme/
  router/
  apiClient.ts
  envelopes.ts
  reactQuery.ts

domains/
  messages/
    schemas.ts
    queryKeys.ts
    service.ts
    errors.ts
    useMessages.ts
    useSendMessage.ts
  threads/
    ...

ui/
  messages/
    MessageList/
      MessageList.tsx
      MessageItem.tsx
      MessageList.skeleton.tsx
      MessageList.empty.tsx
    MessageComposer/
      MessageComposer.tsx
      useMessageComposerVM.ts
  threads/
    ThreadItem/
      ThreadItem.tsx
      ThreadItemMenu.tsx
      RenameThreadDialog.tsx
      DeleteThreadDialog.tsx
      useThreadWizardVM.ts

pages/
  WorkspaceThreadPage.tsx

shared/
  components/
  utils/
  types/

mocks/
  handlers/
  browser.ts
  server.ts

tests/
  setup.ts
  render.tsx
  router.tsx
  testServer.ts

docs/
  PROGRESS.md
  ARCHITECTURE.md
  README.md
```
