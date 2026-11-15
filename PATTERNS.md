# PATTERNS.md

How the code in this repo is shaped. Read it before adding a domain, a query, a mutation, a route or a component. Layer boundaries, commands and code style are in [AGENTS.md](AGENTS.md); this file does not repeat them.

Each rule names a file that follows it. When the code and this file disagree, the code wins and this file gets fixed.

---

## 1. Domains live in two places

The `@smartspace/chat-ui` package holds what the chat surface needs: messages, thread detail, workspace detail, files, flow-run variables. The app's `src/domains/<name>/` holds every service, and the app-only surface of each domain: the sidebar's thread list with pin, rename and delete, the workspace list, comments, notifications.

| Half    | Where                                  | Owns                                                                                                                                             |
| ------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package | `packages/chat-ui/src/domains/<name>/` | The domain's `model.ts`, `mapper.ts`, `schemas.ts`, `queryKeys.ts`, and the chat surface's `queries.ts` / `mutations.ts`                         |
| App     | `src/domains/<name>/`                  | `service.ts` (the SDK call, `parseOrThrow`, any coercion the generated schema needs), and `queries.ts` / `mutations.ts` for the app-only surface |

The package never calls the API. Its hooks take a `ChatService` (`packages/chat-ui/src/platform/chat/ChatService.ts`) and call methods on it. The app supplies one: `src/platform/chat/defaultChatService.ts` delegates each method to a `src/domains/*/service.ts` function and does nothing else. A fork replaces that one file.

App-side hooks call their service directly, not through `ChatService`. Where the package has the domain, they use its key factory (`threadsKeys`, `workspaceKeys` from `@smartspace/chat-ui`), so an invalidation from either side reaches the same cache entries. Each app barrel says which half it holds (`src/domains/threads/index.ts`).

A domain only the app uses (`comments`, `notifications`, `thread-users`) is whole in `src/domains/<name>/`. A `src/domains/<name>/` folder with only `service.ts` and `index.ts` is the normal shape for a domain the chat surface owns, not an unfinished one.

### Where new things go

| Adding                             | Goes in                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| An API call                        | `src/domains/<name>/service.ts`                                                   |
| An API call the chat surface needs | the above, plus a method on `ChatService` and its line in `defaultChatService.ts` |
| A hook the chat surface uses       | `packages/chat-ui/src/domains/<name>/queries.ts` / `mutations.ts`                 |
| A hook only the app uses           | `src/domains/<name>/queries.ts` / `mutations.ts`                                  |
| A query key                        | the domain's `queryKeys.ts`, in the package when the package has the domain       |
| A domain type                      | the domain's `model.ts`, as a `type` alias                                        |

Outside a domain, import its `index.ts`, `queries`, `mutations` or `model`. Lint blocks `service`, `mapper` and `dto` (`.eslintrc.js`, `no-restricted-imports`).

---

## 2. Calling the API

```ts
// src/domains/workspaces/service.ts
const { workSpacesGetIdResponse: workspaceResponseSchema } = ChatZod;
const chatApi = ChatApi.getSmartSpaceChatAPI();

export async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await chatApi.workSpacesGetId(id);
  const parsed = parseOrThrow(
    workspaceResponseSchema,
    response.data,
    `GET /workspaces/${id}`
  );
  return mapWorkspaceDtoToModel(parsed);
}
```

- Call the generated method on `ChatApi.getSmartSpaceChatAPI()`.
- Validate with the generated `ChatZod` schema through `parseOrThrow` (`src/platform/validation.ts`), with the method and path as context.
- Map to the domain model before returning. Callers never see a DTO (data transfer object).
- The streaming endpoints use `fetchAuthed` (`src/platform/api/fetchAuthed.ts`), because the generated client cannot read a stream. It attaches the token and routes an auth 401 into re-sign-in, as the axios interceptor does.
- Raw `api.get` / `api.put` / `api.post` calls remain in `domains/files`, `domains/flowruns` and `domains/speech`. Do not add another without the reason the generated method cannot be used.

Never read install config from `import.meta.env`. Use `ssConfig('<key>')` (`src/platform/config/ssConfig.ts`). `src/test/architecture/buildTimeConfig.spec.ts` fails a new read.

---

## 3. Queries

```ts
// packages/chat-ui/src/domains/threads/queries.ts
export const threadDetailOptions = ({ service, workspaceId, threadId }) =>
  queryOptions({
    queryKey: threadsKeys.detail(workspaceId, threadId),
    queryFn: () => service.fetchThread(workspaceId, threadId),
    staleTime: 60_000,
  });
```

- Export a `queryOptions` factory, and a `use*` hook that spreads it. Route loaders use the factory (`ensureQueryData`); components use the hook.
- Write a `queryFn` only inside a factory in a domain `queries.ts`. A component that needs `enabled`, polling or a placeholder spreads the factory and adds it.
- Keys come from the domain's `queryKeys.ts` factory, so invalidation can target a list, a detail or the whole domain.
- The default `staleTime` is 60 seconds (`src/platform/reactQueryClient.ts`). Seven queries use 30 seconds and two use `Infinity`, none with a stated reason. A new query that sets a value other than the default says why in a comment.
- Reads retry up to twice, and only when the failure is transient (`isTransientRead` in `src/platform/envelopes.ts`). Auth failures never retry.

---

## 4. Mutations

```ts
// src/domains/threads/mutations.ts (shape)
return useMutation({
  mutationFn: ...,
  onMutate: async (vars) => { /* cancel, snapshot, write optimistic value */ },
  onError: (_err, _vars, ctx) => { /* restore snapshot */ toast.error('Failed to rename thread'); },
  onSettled: () => queryClient.invalidateQueries({ queryKey: threadsKeys.lists() }),
});
```

- `useMutation` is called only in a domain `mutations.ts`.
- Every mutation has an `onError`. It tells the user with `toast.error('<what failed>')` from `sonner`, naming the action.
- Invalidate in `onSettled`, so the cache refreshes whether the write succeeded or not. `onSuccess` is for a success toast or a follow-up the success alone causes.
- Optimistic updates (pin, rename, delete in `src/domains/threads/mutations.ts`) cancel the queries they touch, snapshot, write, and restore the snapshot in `onError`.
- Mutations retry at most once, and only when `isTransient` says so: a network error, an `AppError` the API marked `retryable`, or a 5xx with no body. It does not read the body of a raw `AxiosError`. `isTransientRead` does, and is for reads only, because resending a write can apply it twice.

---

## 5. Components

- Feature components live in `src/ui/<feature>/`. Full screens live in `src/pages/`. The chat surface itself (`MessageList`, `MessageComposer`) lives in the package.
- New component files are PascalCase (`ThreadItem.tsx`), the majority form today.
- A component reads its own data through domain hooks. A page does not fetch on a child's behalf.

### When logic leaves the component

- **Orchestration** — navigation, mutations, toasts, derived flags from several hooks — goes in a view-model hook beside the component: `ThreadItem.vm.ts` exports `useThreadItemVm`, and `ThreadItem.tsx` calls it and renders. Five components use this today (`ThreadItem`, `ThreadsList`, `WorkspaceSwitcher`, `MessageComposer`, `VariablesForm`).
- **Pure logic** — formatting, mapping, decisions on loaded data — goes in a plain function: the domain's mapper, or `src/shared/utils/`. It takes data, not hooks, and gets its own spec.
- A small component with one hook and no branching stays one file.

---

## 6. Routing

- TanStack Router, file-based, under `src/routes/`. `routeTree.gen.ts` is generated; never edit it.
- Everything signed-in sits under `_protected`. Its `beforeLoad` checks the session and a silent token, and redirects to `/login?redirect=<path>` if either fails (`src/routes/_protected.tsx`).
- A route with a record primes it in its loader with `ensureQueryData(<domain>DetailOptions(...))`.
- A record that is gone redirects; it does not show a not-found page. A missing workspace goes to `/workspace`; a missing thread goes to another thread or a new draft (`$threadId.tsx`). Check `isNotFoundError` first and rethrow anything else.
- A cancelled fetch in a loader is not a not-found. `$threadId.tsx` returns `null` on `isCancelledError` for this reason.
- URL state is validated with a zod schema in `validateSearch` (`threadRouteSearchSchema`) and written with `navigate({ to: '.', search: (prev) => ({ ...prev, ... }) })`.
- Navigate with a typed `to` and `params`. No string paths.
- Read route ids through `useRouteIds()` (`src/platform/routing/RouteIdsProvider.tsx`) or the route's own `Route.useParams()`.

---

## 7. Errors

| Where it fails                       | What the user sees                                           | Code                                                                                 |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| A route's loader or component throws | The `Envelope` page with Retry, or Sign in for an auth error | `RootErrorBoundary`, `ProtectedErrorBoundary` in `src/app/ui/RouteErrorEnvelope.tsx` |
| A query a component owns             | An inline message in that component                          | `ThreadsList.tsx`, `chat-header.tsx`, `sidebar-right.tsx`                            |
| A mutation                           | A `sonner` toast naming the action                           | the domain's `mutations.ts`                                                          |
| A render error outside the router    | "Something went wrong" with the message                      | `fallbackRender` in `src/main.tsx`                                                   |

- Errors come in two shapes. The generated client throws an `AxiosError`. `request()` (`src/platform/request.ts`) returns an `AppError` (`src/platform/envelopes.ts`). Helpers that classify a failure handle both: `isNotFoundError`, `isTransientRead`, and the boundary's `isAuthError`.
- A 5xx response's detail is not shown to the user. `toAppError` keeps a 4xx detail only.
- Show the API's `traceId` as the support reference where the error page has one (`getTraceId`).

---

## 8. Sign-in and expiry

- The API layer only ever asks for a token silently (`getAccessToken({ silentOnly: true })` in `src/platform/api/configureApiClient.ts`). It never opens a popup or redirect itself.
- A dead session reaches `handleSessionExpired()` (`src/platform/auth/sessionExpiry.ts`) from three places: the request interceptor when the silent token fails, a 401 carrying `X-Reauth-Required` (axios and `fetchAuthed`), and a SignalR 401. It runs one recovery at a time, and after 3 attempts in 60 seconds it stops and shows the stuck prompt.
- A 401 without `X-Reauth-Required` is the API refusing the action, not an expired session. Leave it to the caller.
- In Teams a popup needs a click, so recovery shows `SessionExpiryPrompt` and the click signs in.

---

## 9. Tests

Detail is in [docs/testing.md](docs/testing.md). The rules:

- Vitest and React Testing Library. Specs sit in a `__tests__/` folder beside the code.
- The network is faked with MSW (Mock Service Worker) handlers in `src/test/mocks/handlers/`. Response bodies come from factories built on the SDK's zod schemas (`src/test/factories/`), so they stay valid when the SDK changes. Override one handler per test with `server.use(...)`.
- No factories for domain models. Get a model by running a factory's DTO through the real mapper.
- `src/test/setup.ts` mocks MSAL, Teams NAA (Nested App Authentication), SignalR and logging for every spec. Do not mock a domain's queries, mutations or service in a new spec; fake the network instead. Three older specs still do (`threadStreamReconnect.spec.tsx`, `defaultChatService.spec.ts`, `ThreadRenameModal.spec.tsx`); they are not the pattern.
- `src/test/conformance/spec-conformance.spec.ts` fuzzes each generated response schema through the domain's parse and mapper. If an SDK bump fails it, relax the mapper, never the test.
- `src/test/architecture/` holds fitness tests. Each lists the violations that remain, and the list must equal what is on disk exactly: a new violation fails, and so does a fixed one left on the list. Shrink a list in the same change that fixes an entry. Never add to one.
