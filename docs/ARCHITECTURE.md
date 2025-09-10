# Architecture Overview

This document describes the architecture for the Smartspace UI-v2 migration.

## Layers

* **platform/** → Core setup: theming, router, api client, envelopes, providers.
* **domains/** → Per-feature data folders: messages, comments, workspaces, threads, etc. Contains schemas, queryKeys, service, hooks.
* **ui/** → Feature UI composition: components + optional VM hooks colocated.
* **pages/** → Route-level composition; map params/search → props → UI.
* **shared/** → Reusable components, utilities, types.
* **docs/** → PROGRESS.md, ARCHITECTURE.md, README.md
* **mocks/** → MSW handlers for local/dev/demo.
* **tests/** → Test helpers (`renderWithApp`, setup, router, server).

## Data Flow

1. **TanStack Router** manages routes, params, and search state.
2. **React Query** handles fetching and caching.
3. **Zod** validates server responses and enforces runtime safety.
4. **MUI Theme** provides a consistent design system with responsive breakpoints.

## Rules

* Domains never import other domains directly.
* Shared code lives in `shared/` for cross-domain utilities.
* Keep queries colocated with their domain.
* Domain-specific error helpers must live inside that domain (e.g., `domains/messages/errors.ts`).
* Use MSW for consistent local/dev testing and demo mode.
* Use View-Model (VM) hooks only when justified (multi-step, optimistic updates, complex logic). Skip for trivial/presentational components.

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
