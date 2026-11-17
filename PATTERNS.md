# PATTERNS.md

How the code in this repo is shaped, and the rules new code follows. Read it before adding a domain, a query, a mutation, a route or a component. Layer boundaries, commands and code style are in [AGENTS.md](AGENTS.md); this file does not repeat them.

Where the code does not follow a rule yet, this file says so. Where an architecture spec in `src/test/architecture/` tracks the exceptions, it names the spec; the spec's list is the record, not this file. When the code and this file disagree on what exists, the code wins and this file gets fixed.

---

## 1. Domains live in two places

The `@smartspace/chat-ui` package holds what the chat surface needs: messages, thread detail, workspace detail, files, flow-run variables, models, speech. The app's `src/domains/<name>/` holds every service, the app-only surface of a shared domain (the sidebar's thread list with pin, rename and delete; the workspace list), and the domains only the app uses (`comments`, `notifications`, `thread-users`).

| Half    | Where                                  | Holds                                                                                                                                                    |
| ------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package | `packages/chat-ui/src/domains/<name>/` | The model and key factory of a shared domain, and the chat surface's `queries.ts` / `mutations.ts`. Mappers and schemas where the package maps the data  |
| App     | `src/domains/<name>/`                  | `service.ts` (the SDK call, `parseOrThrow`, any coercion the generated schema needs), app-only `queries.ts` / `mutations.ts`, and app-only domains whole |

The package never calls the API through the generated client. Its hooks take a `ChatService` (`packages/chat-ui/src/platform/chat/ChatService.ts`) and call methods on it. The app supplies one: `src/platform/chat/defaultChatService.ts` maps each method onto a `src/domains/*/service.ts` function, renaming an argument or dropping a return value where the two shapes differ, and holds no other logic. A fork replaces that one file. One exception: `packages/chat-ui/src/shared/utils/userPhoto.ts` builds a `/users/{id}/photo` URL from `window.ssconfig` itself.

App-side hooks call their service directly, not through `ChatService`. `src/domains/threads` and `src/domains/workspaces` use the package's key factories (`threadsKeys`, `workspaceKeys`), so an invalidation from either side reaches the same cache entries. The barrels of `threads`, `workspaces`, `messages` and `files` say in a header comment which half they hold.

The shape is not uniform today:

- `src/domains/models` and `src/domains/flowruns` have their own `model.ts`, `mapper.ts` and `queryKeys.ts` beside the package's. Their services use the app copies; the app copies of the keys and of `useFlowRunVariables` have no callers outside their folder.
- `src/domains/speech` has no `index.ts`. `src/domains/messages` adds `threadStream.ts`.
- Schemas live on both sides: `src/domains/{comments,models,speech}/schemas.ts` and `packages/chat-ui/src/domains/{files,messages}/schemas.ts`.

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
- An endpoint that streams uses `fetchAuthed` (`src/platform/api/fetchAuthed.ts`), because the generated client cannot read a stream. It attaches the token and routes an auth 401 into re-sign-in, as the axios interceptor does.
- Every other hand-written call is listed, with its reason, in `src/test/architecture/rawTransport.spec.ts`. Several now have a generated method and are waiting to move. Moving one changes what it throws (see §7), so check the caller's error handling when you do.

Never read install config from `import.meta.env`. Use `ssConfig('<key>')` (`src/platform/config/ssConfig.ts`). `src/test/architecture/buildTimeConfig.spec.ts` fails a new read.

---

## 3. Queries

```ts
// packages/chat-ui/src/domains/threads/queries.ts
export const threadDetailOptions = ({ service, workspaceId, threadId }) =>
  queryOptions({
    queryKey: threadsKeys.detail(workspaceId, threadId),
    queryFn: () => service.fetchThread(workspaceId, threadId),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
```

- Export a `queryOptions` factory from the domain's `queries.ts`, and a `use*` hook that spreads it. Route loaders use the factory (`ensureQueryData`); components use the hook.
- Write a `queryFn` only inside such a factory. A component that needs `enabled`, polling or a placeholder spreads the factory and adds it. `src/test/architecture/queryOwnership.spec.ts` enforces this and lists the files that do not follow it yet.
- Keys come from the domain's `queryKeys.ts` factory, so invalidation can target a list, a detail or the whole domain.
- The default `staleTime` is 60 seconds (`src/platform/reactQueryClient.ts`). Many queries set another value, from 0 to `Infinity`, and few say why. A new query that sets a value other than the default says why in a comment, as `packages/chat-ui/src/domains/speech/queries.ts` does.
- By default a read retries up to twice, only when the failure is transient (`isTransientRead` in `src/platform/envelopes.ts`), and never on an `AuthRequiredError`. A query can override this: several in the package set `retry: false` or `retry: 1`, and `useSpeechConfig` retries any failure twice.

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

The rules, each enforced by an architecture spec that lists the mutations not following it yet:

- `useMutation` is called only in a domain `mutations.ts` (`queryOwnership.spec.ts`).
- Every mutation has an `onError` that tells the user, with `toast.error('<what failed>')` from `sonner`, naming the action (`mutationHygiene.spec.ts`).
- Invalidate in `onSettled`, so the cache refreshes whether the write succeeded or not. Not in `onSuccess`, and not at the end of `mutationFn`; both run only as far as the write succeeds. `onSuccess` is for a success toast or a follow-up the success alone causes (`mutationHygiene.spec.ts`). `src/domains/threads` and `src/domains/thread-users` follow it today.

Also:

- Optimistic updates (pin, rename, delete in `src/domains/threads/mutations.ts`) cancel the queries they touch, snapshot, write, and restore the snapshot in `onError`.
- By default a mutation retries at most once, and only when `isTransient` says so: a network error, an `AppError` the API marked `retryable`, or an `UnknownError` with status 500 or above and no `retryable` flag. It does not read the body of a raw `AxiosError`. `isTransientRead` does, and is for reads only, because resending a write can apply it twice. Some mutations set `retry` themselves.

---

## 5. Components

- Feature components live in `src/ui/<feature>/`. Full screens live in `src/pages/`. The chat surface itself (`MessageList`, `MessageComposer`) lives in the package.
- New component files are PascalCase (`ThreadItem.tsx`), the majority form today.
- A component reads its own data through domain hooks. A page does not fetch on a child's behalf.

### When logic leaves the component

- **Orchestration** (navigation, mutations, toasts, derived flags from several hooks) goes in a view-model hook beside the component: `ThreadItem.vm.ts` exports `useThreadItemVm`, and `ThreadItem.tsx` calls it and renders. Five components use this today (`ThreadItem`, `ThreadsList`, `WorkspaceSwitcher`, `MessageComposer`, `VariablesForm`).
- **Pure logic** (formatting, mapping, decisions on loaded data) goes in a plain function: the domain's mapper, or `src/shared/utils/`. It takes data, not hooks, and gets its own spec.
- A small component with one hook and no branching stays one file.

---

## 6. Routing

- TanStack Router, file-based, under `src/routes/`. `routeTree.gen.ts` is generated; never edit it.
- Everything signed-in sits under `_protected`. Its `beforeLoad` checks the session and a silent token, and redirects to `/login?redirect=<path>` if either fails, except a token request that failed on the network (`TransientAuthError`), which lets the navigation carry on (`src/routes/_protected.tsx`).
- A route with a record primes it in its loader with `ensureQueryData(<domain>DetailOptions(...))`.
- A route with a `pendingComponent` keeps the old page for `defaultPendingMs` (200 ms, `src/main.tsx`) while its loader runs, then shows that component for at least `defaultPendingMinMs` (300 ms). A route without one shows nothing early: the router holds the old page until the load finishes. The workspace layout's is `PageSkeleton`, so a slow cold load goes splash, then skeleton, then page. There is none on the root or `_protected`: a text loader screen there replaced the boot splash and flickered (removed in March 2026).
- A record that is gone redirects; it does not show a not-found page. A missing workspace goes to `/workspace`; a missing thread goes to another thread or a new draft (`$threadId.tsx`).
- In a loader's catch, check `isCancelledError` first: a fetch cancelled by an unrelated mutation is not a not-found, and `$threadId.tsx` returns `null` for it. Then `isNotFoundError`, and rethrow anything else.
- When a thread's detail 404s and the first thread in the list is the same one, `$threadId.tsx` returns `null` instead of redirecting, so it cannot loop.
- URL state is validated with a zod schema in `validateSearch` (`threadRouteSearchSchema`) and written with `navigate({ to: '.', search: (prev) => ({ ...prev, ... }) })`.
- Navigate with a typed `to` and `params`, never a string path.
- Read route ids through `useRouteIds()` (`src/platform/routing/RouteIdsProvider.tsx`) or the route's own `Route.useParams()`.

---

## 7. Errors

| Where it fails                       | What the user sees                                           | Code                                                                                 |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| A route's loader or component throws | The `Envelope` page with Retry, or Sign in for an auth error | `RootErrorBoundary`, `ProtectedErrorBoundary` in `src/app/ui/RouteErrorEnvelope.tsx` |
| A query a component owns             | An inline message in that component                          | `ThreadsList.tsx`, `chat-header.tsx`, `sidebar-right.tsx`                            |
| A mutation                           | A `sonner` toast naming the action                           | the domain's `mutations.ts`                                                          |
| A render error outside the router    | "Something went wrong" with the message                      | `fallbackRender` in `src/main.tsx`                                                   |

A failed call reaches its caller in one of three shapes:

- The generated client throws an `AxiosError`.
- `request()` (`src/platform/request.ts`) returns a `Result` whose error is an `AppError` (`src/platform/envelopes.ts`), and the `api` / `apiParsed` wrappers throw that `AppError`.
- A `fetchAuthed` caller throws a plain `Error` with its own message (`src/domains/messages/service.ts`).

`isNotFoundError`, `isTransientRead` and the boundary's `isAuthError` handle the first two. None of them classifies the third.

- A 5xx response's detail is not shown to the user. `toAppError` keeps a 4xx detail only.
- Show the API's `traceId` as the support reference where the error page has one (`getTraceId`).

---

## 8. Sign-in and expiry

- The API layer only ever asks for a token silently (`getAccessToken({ silentOnly: true })` in `src/platform/api/configureApiClient.ts`). It never opens a popup or redirect itself.
- A dead session reaches `handleSessionExpired()` (`src/platform/auth/sessionExpiry.ts`) from three places: a silent token failure in the request interceptor or `fetchAuthed` (which sends messages), a 401 carrying `X-Reauth-Required` (axios and `fetchAuthed`), and a SignalR 401. It runs one recovery at a time, and after 3 attempts in 60 seconds it stops and shows the stuck prompt. A click on the prompt is not an attempt.
- A 401 without `X-Reauth-Required` is the API refusing the action, not an expired session. Leave it to the caller.
- A token request that failed on the network is not an expired session either. The MSAL adapter (`msalWeb.ts`, also used in Teams when Teams signs in with MSAL) throws `TransientAuthError` for MSAL's network error codes; the interceptor and `fetchAuthed` let the request fail as any offline request does and start no recovery. A network failure in recovery's own silent refresh shows no prompt, and the protected-route `beforeLoad` lets the navigation carry on instead of redirecting to `/login`.
- On the web, `main.tsx` also checks the session when the tab becomes visible again (`checkSessionOnVisible`), so a session that died while the tab was hidden shows the prompt before the user acts. It never opens a popup.
- On the web, recovery first refreshes the token silently, skipping the cached one, and re-runs every active query and route loader (`onSessionRenewed`, wired in `src/main.tsx`; `RealtimeProvider` also rebuilds a hub that is down). If that fails, `SessionExpiryPrompt` shows and its click opens a sign-in popup (`renewSessionWithPopup`), so the page survives. Start the popup synchronously inside the click: a browser allows a popup only shortly after a click, so an await before it can get it blocked. If the popup does not complete, the prompt also offers the full-page sign-in.
- In Teams a popup needs a click, so recovery shows `SessionExpiryPrompt` and the click signs in.

---

## 9. Tests

Detail is in [docs/testing.md](docs/testing.md). The rules for new specs:

- Vitest and React Testing Library. Specs sit in a `__tests__/` folder beside the code.
- Fake the network with MSW (Mock Service Worker) handlers in `src/test/mocks/handlers/`. Response bodies come from factories built on the SDK's zod schemas (`src/test/factories/`), so they stay valid when the SDK changes. Override one handler per test with `server.use(...)`.
- No factories for domain models. Get a model by running a factory's DTO through the real mapper.
- `src/test/setup.ts` mocks MSAL, Teams NAA (Nested App Authentication), SignalR and logging for every spec. Do not mock or spy on a domain's queries, mutations or service, and do not mock `@smartspace/api-client`; fake the network instead.

Older specs do not all follow this, and are not the pattern to copy:

- Seven mock or spy on domain code: `comments/__tests__/mutations.spec.tsx` and `queries.spec.ts`, `flowruns/__tests__/queries.spec.ts`, `notifications/__tests__/mutations.spec.tsx`, `messages/__tests__/threadStreamReconnect.spec.tsx` (all under `src/domains/`), `src/platform/chat/__tests__/defaultChatService.spec.ts`, and `src/ui/threads/__tests__/ThreadRenameModal.spec.tsx`.
- Nine mock `@smartspace/api-client` instead of using MSW, among them the `service.spec.ts` files under `src/domains/*/__tests__/`.

Two suites guard the shape of the code:

- `src/test/conformance/spec-conformance.spec.ts` fuzzes each generated response schema through the domain's parse and mapper. If an SDK bump fails it, relax the mapper, never the test.
- `src/test/architecture/` holds fitness tests. Each lists the violations that remain, and the list must equal what is on disk exactly: a new violation fails, and so does a fixed one left on the list. Shrink a list in the same change that fixes an entry. Never add to one.
