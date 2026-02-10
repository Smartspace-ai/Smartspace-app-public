# Planned vs Actual Repo (ARCHITECTURE.md vs Current Codebase)

This document compares the structure and conventions in `ARCHITECTURE.md` with what is implemented in `Smartspace-app-public` today. It helps identify gaps and the source of issues (e.g. focus/stack overflow bugs).

---

## Summary

| Area               | Planned                                                          | Actual                                                                                      | Status                                                       |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Focus / Dialog** | —                                                                | `DialogContent` was calling `onOpenAutoFocus` on every focus event                          | **Fixed**: now fires once per open to prevent stack overflow |
| **Platform**       | theme/, router/, apiClient, reactQuery                           | theme at `src/theme/`; api under `platform/api/`; reactQueryClient; auth, realtime, routing | Partially aligned                                            |
| **Domains**        | schemas, queryKeys, service, errors, useMessages, useSendMessage | Same concepts; hooks live in `queries.ts` / `mutations.ts`                                  | Aligned                                                      |
| **UI**             | Feature folders with subfolders (MessageList/, MessageComposer/) | Flat files per feature (MessageList.tsx, MessageComposer.tsx)                               | Different layout                                             |
| **Pages**          | WorkspaceThreadPage                                              | WorkspaceThreadPage + Login, no_workspaces_available, teams_loader                          | More pages than planned                                      |
| **Mocks**          | mocks/handlers, browser.ts, server.ts                            | No mocks folder                                                                             | Missing                                                      |
| **Tests**          | tests/setup, render, router, testServer                          | test/setup.ts; **tests** under platform/ and domains/                                       | Different layout                                             |

---

## 1. Platform

**Planned (ARCHITECTURE.md):**

- `platform/theme/`, `platform/router/`, `apiClient.ts`, `envelopes.ts`, `reactQuery.ts`

**Actual:**

- **Theme:** `src/theme/` (at root, not under `platform/`). Contains `branding.ts`, `public-config.ts`, `tag-styles.ts`.
- **Router:** `src/platform/router/context.ts`; file-based routes in `src/routes/`; `src/routeTree.gen.ts` (TanStack Router).
- **API:** `src/platform/api/apiClient.ts`, `orvalMutator.ts`; generated client at `src/platform/api/generated/chat/` (api + zod).
- **Envelopes / React Query:** `platform/envelopes.ts`, `platform/reactQueryClient.ts`.
- **Extra:** `platform/auth/`, `platform/realtime/`, `platform/routing/`, `platform/validation.ts`, `platform/request.ts`, `platform/apiParsed.ts`.

**Verdict:** Aligned in spirit. Theme lives at `src/theme/`; generated API is under `platform/api/generated/chat/`. No `platform/theme/` folder.

---

## 2. Domains

**Planned:** Per-feature folders with `schemas.ts`, `queryKeys.ts`, `service.ts`, `errors.ts`, and hooks like `useMessages.ts`, `useSendMessage.ts`.

**Actual:**

- **messages:** schemas, queryKeys, service, errors, mapper, model, **queries.ts** (exports `useMessages`), **mutations.ts** (exports `useSendMessage`), workspace.ts. No separate `useMessages.ts` / `useSendMessage.ts`; hooks are colocated in queries/mutations.
- **threads, comments, workspaces, models, files, flowruns, notifications, users:** Same pattern (mapper, model, queries, mutations, queryKeys, schemas, service). Some have `errors.ts` (e.g. messages).

**Verdict:** Aligned. Hook names and behavior match; file organisation uses `queries.ts` / `mutations.ts` instead of one file per hook.

---

## 3. UI

**Planned:**

- `ui/messages/MessageList/` (MessageList.tsx, MessageItem.tsx, MessageList.skeleton.tsx, MessageList.empty.tsx)
- `ui/messages/MessageComposer/` (MessageComposer.tsx, useMessageComposerVM.ts)
- `ui/threads/` (ThreadItem/, ThreadItemMenu, RenameThreadDialog, DeleteThreadDialog, useThreadWizardVM)

**Actual:**

- **messages:** Flat: MessageList.tsx, MessageItem.tsx, MessageComposer.tsx, MessageComposer.vm.ts, MessageBubble, MessageAttachmentList, MessageCopyButton, MessageFileDownload, MessageImage, MessageSources. No `MessageList.skeleton.tsx` or `MessageList.empty.tsx`; no `MessageList/` subfolder.
- **threads:** ThreadItem.tsx, ThreadItem.vm.ts, ThreadsList.tsx, ThreadsList.vm.ts, NewThreadButton.tsx, **ThreadRenameModal.tsx** (not RenameThreadDialog). No ThreadItemMenu, DeleteThreadDialog, or useThreadWizardVM.
- **Extra:** chat-variables/, comments_draw/, header/, layout/, workspaces/.

**Verdict:** Different layout (flat vs subfolders); some components renamed or not present (e.g. ThreadRenameModal vs RenameThreadDialog). VM pattern used where planned (MessageComposer, ThreadItem).

---

## 4. Pages

**Planned:** Route-level composition; example `WorkspaceThreadPage.tsx`.

**Actual:** `pages/WorkspaceThreadPage/chat.tsx`, `pages/Login/`, `no_workspaces_available.tsx`, `teams_loader.tsx`. Route composition lives in `src/routes/` (e.g. `_protected/workspace/$workspaceId/thread/$threadId.tsx`).

**Verdict:** More pages than in the example; routing is file-based as planned.

---

## 5. Shared

**Planned:** `shared/components/`, `shared/utils/`, `shared/types/`.

**Actual:** `shared/components/`, `shared/utils/`, `shared/hooks/`, `shared/models/`, `shared/ui/` (markdown, mui-compat, shadcn, mui-bridge, mui-overrides). No dedicated `shared/types/`; types are often colocated or in domain/shared models.

**Verdict:** Broader than planned (shared UI and hooks). Types are distributed.

---

## 6. Mocks & Tests

**Planned:** `mocks/handlers/`, `browser.ts`, `server.ts`; `tests/setup.ts`, `render.tsx`, `router.tsx`, `testServer.ts`.

**Actual:**

- **Mocks:** No `mocks/` folder in the repo.
- **Tests:** `src/test/setup.ts`; `__tests__` inside `platform/`, `domains/*/`, etc. No single `tests/` folder with shared `render.tsx`, `router.tsx`, `testServer.ts`.

**Verdict:** Mocks missing; test layout differs (test/ + **tests** vs tests/ with shared helpers).

---

## 7. Bug Fix: Dialog Focus Loop (Maximum call stack size exceeded)

**Cause:** `DialogContent` in `shared/ui/mui-compat/dialog.tsx` was calling `onOpenAutoFocus(e)` on **every** `onFocus` event. With MUI’s focus trap and callers using `onOpenAutoFocus={(e) => e.preventDefault()}`, this led to:

1. Dialog opens → focus moves → `onFocus` fires → `onOpenAutoFocus(e)` → `e.preventDefault()`
2. Focus trap reacts → focus moves again → `onFocus` again → infinite loop → **RangeError: Maximum call stack size exceeded**

**Fix:** `onOpenAutoFocus` is now invoked **once per open**: a ref tracks whether it has been fired for the current open state (using `open` from `DialogContext`). After the first focus event, it is not called again until the dialog is closed and reopened.

**Relevant files:** `src/shared/ui/mui-compat/dialog.tsx` (DialogContext extended with `open`; `DialogContent` uses `openAutoFocusFiredRef` and resets it when `ctx?.open` becomes true).

---

## Recommendations

1. **Keep the dialog fix** in place so the stack overflow does not return.
2. **Optional:** Add `mocks/` and MSW setup as in ARCHITECTURE for local/demo and tests.
3. **Optional:** Add `MessageList.skeleton.tsx` and `MessageList.empty.tsx` if you want to match the planned UI structure.
4. **Optional:** Centralise test helpers under something like `src/test/` (e.g. `render.tsx`, `router.tsx`, `testServer.ts`) for consistency with the doc.
