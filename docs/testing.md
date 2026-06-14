# Testing Patterns

## Test pyramid

Three levels, one shared factory layer:

```
                  ┌─────────────────┐
                  │   Playwright    │  Browser integration — real browser, mocked network
                  ├─────────────────┤
                  │  Vitest + RTL   │  Component tests — JSDOM, mocked network
                  ├─────────────────┤
                  │   Vitest unit   │  Pure logic — mappers, utils, query keys
                  └─────────────────┘
                        ↑ all levels consume
                  ┌─────────────────┐
                  │ src/test/       │  Factories + MSW handlers (shared)
                  └─────────────────┘
```

**Run cadence**: unit + component on every PR; Playwright nightly and on merge to main.

---

## Factories (`src/test/factories/`)

Factories generate realistic test data from the `@smartspace/api-client` Zod schemas using `zod-schema-faker`. Because they derive from the same schemas the app uses to parse API responses, they stay in sync automatically when the SDK is bumped.

### Pattern

```typescript
import { fake } from 'zod-schema-faker/v4';
import { ChatModels, ChatZod } from '@smartspace/api-client';

export const makeThreadSummary = (
  overrides: Partial<ChatModels.MessageThreadMessageThreadSummary> = {}
): ChatModels.MessageThreadMessageThreadSummary => ({
  ...fake(ChatZod.workSpacesThreadResponse.shape.data.element),
  ...overrides,
});
```

For list-response schemas, extract the element type via `.shape.data.element` (Zod v4 public API).

### What lives here

| Factory                     | Schema source                                                               |
| --------------------------- | --------------------------------------------------------------------------- |
| `makeWorkspace`             | `ChatZod.workSpacesGetIdResponse`                                           |
| `makeWorkspacesResponse`    | wraps `makeWorkspace`                                                       |
| `makeAppUser`               | `ChatZod.workSpacesGetUsersResponseItem`                                    |
| `makeThreadUser`            | `ChatZod.messageThreadsGetThreadUsersResponseItem`                          |
| `makeThreadSummary`         | `ChatZod.workSpacesThreadResponse.shape.data.element`                       |
| `makeThreadsResponse`       | wraps `makeThreadSummary`                                                   |
| `makeCommentSummary`        | `ChatZod.messageThreadsGetCommentsResponse.shape.data.element`              |
| `makeNotificationDto`       | `ChatZod.notificationGetResponse.shape.data.element`                        |
| `makeNotificationsResponse` | wraps `makeNotificationDto`                                                 |
| `makeMessage`               | `ChatZod.messageThreadsThreadMessagesIdMessagesResponse.shape.data.element` |
| `makeMessageValue`          | same schema, `.values[0]`                                                   |

### No domain-model factories

Don't create factories for domain models (the types returned by mappers — `Comment`, `Notification`, etc.). MSW handlers return DTOs that flow through the real mapper, so tests get domain models via the actual mapping path. If a test needs a domain model object, call the mapper directly:

```typescript
import { mapCommentDtoToModel } from '@/domains/comments/mapper';
const comment = mapCommentDtoToModel(makeCommentSummary());
```

### Seeding faker

`src/test/factories/setup.ts` calls `setFaker(faker)` once. Every factory file imports `./setup` to ensure this runs before `fake()` is called.

---

## MSW handlers (`src/test/mocks/handlers/`)

MSW intercepts HTTP at the network level in both Vitest (node server) and Playwright (browser service worker). Handlers use factories for response bodies so response shapes always match the schema.

### Pattern

```typescript
import { http, HttpResponse } from 'msw';
import { makeThreadSummary } from '@/test/factories';

http.get('*/workspaces/:workspaceId/messagethreads', () =>
  HttpResponse.json({ data: [makeThreadSummary()] })
);
```

Use `*` prefix on URL patterns to match any base URL (local dev, CI, etc.).

### Overriding handlers per test

Override a handler for a specific test without affecting others:

```typescript
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

it('shows error state', () => {
  server.use(
    http.get('*/workspaces', () => new HttpResponse(null, { status: 500 }))
  );
  // ... render and assert
});
```

`server.resetHandlers()` runs after every test (in `src/test/setup.ts`) so overrides never leak.

### Handler files

| File               | Endpoints covered                                                  |
| ------------------ | ------------------------------------------------------------------ |
| `threads.ts`       | GET list, GET single, POST create, DELETE, PUT name, PUT favorited |
| `messages.ts`      | GET list                                                           |
| `comments.ts`      | GET list, POST create                                              |
| `notifications.ts` | GET list, PUT mark-read, PUT mark-all-read                         |
| `workspaces.ts`    | GET list, GET single, GET users                                    |

### Response shape notes

Some endpoints return a `{ data: [...] }` envelope; others return a bare object or array. Handlers match the actual API contract (not a uniform convention). Check the corresponding `service.ts` if the shape is unclear.

---

## Spec-conformance fuzz suite (`src/test/conformance/`)

`spec-conformance.spec.ts` enforces one invariant per domain pipeline: **any
response that conforms to the SDK's generated Zod schema must survive the
local parse + mapper pipeline**. Each table entry fakes payloads from the
generated response schema (deterministically seeded — failures print the seed
and payload), strips every optional field for a "minimal" case, and forces
each enum branch the mappers switch on. The payload then flows through the
exact code the service runs: same `parseOrThrow` call, same coercion helpers
(exported from the service for this purpose), same mappers.

This is the gate that catches "the spec widened but our pipeline didn't" when
bumping `@smartspace/api-client`. If a bump fails here, relax the local
pipeline (mapper default / coercion) rather than weakening the test.

---

## Vitest setup (`src/test/setup.ts`)

- Starts the MSW node server before all tests, resets handlers and calls `cleanup()` after each test, closes the server after all tests.
- Mocks `@/platform/log`, MSAL, Teams NAA, and SignalR globally so tests don't trigger real auth or network connections.

---

## Adding a new domain

1. Add a factory in `src/test/factories/<domain>.ts` using `fake()` on the appropriate `ChatZod` schema.
2. Export it from `src/test/factories/index.ts`.
3. Add an MSW handler in `src/test/mocks/handlers/<domain>.ts` for each endpoint the domain calls.
4. Register the handler in `src/test/mocks/handlers/index.ts`.
