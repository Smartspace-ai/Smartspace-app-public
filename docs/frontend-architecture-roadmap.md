# Frontend Architecture Roadmap

> Cleaned-up migration plan for the `render/app` frontend.
> Auth provider abstraction (MSAL vs NAA / Teams) is **out of scope** — that lives in a separate repo.

---

## Phase 1 — Audit Current State ✅

Before changing anything, review and document:

- [x] Map out the current Axios interceptor setup — what auth logic lives there (token attachment, 401 handling, refresh logic, redirect logic, React state updates)?
- [x] Identify anywhere auth tokens are accessed or stored outside of Axios interceptors (localStorage calls, context providers, global state, etc.)
- [x] Document the current route structure — is there a clear auth boundary layout, or is auth checking done per-page/per-component?
- [x] Check for any `useEffect`-based auth redirects in components that should be handled at the router level
- [x] List all React Query queries related to auth/session — are query keys consistent? Is there a session query?
- [x] Review barrel exports per domain — document which domains exist and what they export
- [x] Audit component placement — identify any domain-specific components sitting in the generic UI layer, and any generic UI components sitting inside domain folders
- [x] Document the current codegen pipeline — what tool generates the API client and DTOs, what config/templates are used, what is the output structure?
- [x] Identify all reporting/list pages — document which filters exist, whether they use URL search params or component state, and whether filter changes trigger API calls

### Findings

**Axios interceptors** (`src/api/notedApi.tsx`): Request interceptor was duplicating token acquisition logic (now refactored to use `getAccessToken()` from `src/auth/getToken.ts`). Response interceptor is minimal (logs 401s, no side effects). `loginRedirect()` side effect removed.

**Auth token storage**: MSAL stores tokens in sessionStorage. `AuthProvider` context in `src/auth/auth.tsx` exposes `isAuthenticated`, `logout()`, `account`. Organisation ID stored in localStorage (`activeOrgId`).

**Bug fixed**: `graphApi.tsx` was calling `useMsal()` hook inside a plain async function — replaced with `msalInstance` singleton.

**Route structure**: Well-structured. `_authed.tsx` pathless layout with `beforeLoad` auth guard. `_public.tsx` for unauthenticated routes. No `useEffect`-based auth redirects found. `validateSearch` with Zod used in 3 routes (template-library, settings, auth-callback). Calendar OAuth params still use raw `URLSearchParams` (Phase 5 fix).

**Query keys**: Consistent TKDv5 factory pattern across all 17 active domains. No session/auth query (MSAL manages auth state independently).

**Domain completeness**: 14/17 domains were complete. Fixed: added model.ts, mapper.ts, validation.ts to `calendars/`; added validation.ts to `meetingSources/`; removed empty `features/` folder.

**Component placement**: Domain components in subfolders (`calendars/`, `meetings/`, `templates/`, `dashboard/`). Modals in `src/components/modals/` — domain-specific but in generic location (move to domain folders in Phase 7). No `ui/` folder yet.

**Codegen pipeline**: Complete — 3 generators (swagger-typescript-api, openapi-typescript, @hey-api/openapi-ts). Config in `openapi-ts.config.js`. Scripts: `generate-api` runs all.

**List pages**: No filtering or pagination on any list page yet. Settings and TemplateLibrary use URL search params for tabs only. Calendar uses component state for calendar selection.

**Navigation**: NavBar uses `useNavigate()` + manual `isNavItemActive()` instead of `<Link>` with `activeProps` (Phase 5 fix).

**ESLint boundaries**: `shared` → `app` rule is intentionally permissive — `shared/` imports `HexColor`, `Percentage`, `PixelCount` from `components/editor/models` and `t`/`hasTranslation` from `i18n`. Fix: move editor types to `shared/types/` in Phase 7.

---

## Phase 2 — Axios Cleanup ✅

Slim down Axios to only handle HTTP-level concerns:

- [x] Refactor Axios instance creation to accept an auth token getter — `createApiClient(getAccessToken: () => Promise<string>)`
- [x] Request interceptor should only: call `getAccessToken()` and attach the Bearer token header
- [x] Response interceptor should only: catch 401s and throw a typed `AuthError` — no navigation, no React state updates, no token refresh logic
- [x] Remove any `window.location` redirects from Axios interceptors
- [x] Remove any React Query cache manipulation from Axios interceptors
- [x] Remove any direct token acquisition from interceptors — delegate to the provided token getter

---

## Phase 3 — React Query Auth Integration

Move auth state management into React Query:

- [ ] Create `sessionQueryOptions()` in `src/domains/auth/queries.ts` — calls a session/account endpoint, with `retry: false` and appropriate `staleTime`
- [ ] Set up global React Query error handling in the `QueryClient` config: don't retry on `AuthError`, invalidate session query on auth failures from mutations
- [ ] Ensure all API query factories use the shared Axios instance created from `createApiClient` (so they automatically get token attachment)
- [ ] Verify query key consistency across all domains — no duplicate or conflicting keys for the same data

---

## Phase 4 — TanStack Router Auth Boundary

Move all auth gating to the router layer:

- [ ] Create a pathless layout route `_app.tsx` that wraps all authenticated routes
- [ ] Implement `beforeLoad` in `_app.tsx` that: checks authentication state, attempts silent login if not authenticated, throws `redirect({ to: '/login' })` if login fails
- [ ] Create a pathless layout route `_public.tsx` for unauthenticated routes (login page, OAuth callback)
- [ ] Create `/auth/callback` route under `_public` with: `validateSearch` to parse OAuth redirect params (`code`, `state`), `beforeLoad` that handles the token exchange and redirects to the original destination
- [ ] Wire up router context to include `queryClient` and `apiClient` via `createRouter({ context: { ... } })`
- [ ] Type the router context using `createRootRouteWithContext<{ queryClient: QueryClient, apiClient: AxiosInstance }>()`
- [ ] Remove all auth checking `useEffect` hooks from individual page components
- [ ] Remove any auth-related redirect logic from components — the `_app` `beforeLoad` handles everything
- [ ] Move the login page under `_public/login.tsx` with `validateSearch` for redirect and error search params

---

## Phase 5 — Route Structure Cleanup

Ensure routes follow nested layout conventions:

- [ ] Verify that shared UI (sidebar, header) lives in the `_app.tsx` layout component, not duplicated across pages
- [ ] Confirm `<Outlet />` is used correctly in layout routes
- [ ] Add `validateSearch` to any route that uses URL search params — no raw `useSearchParams()` calls
- [ ] Add route loader functions that call `context.queryClient.ensureQueryData()` with the appropriate query option factories — this enables prefetching on `<Link>` hover
- [ ] Replace any `<a>` tags or manual `window.location` navigation with TanStack Router `<Link>` components (for clickable navigation) or `useNavigate()` (for programmatic navigation)
- [ ] Use `activeProps` / `inactiveProps` on `<Link>` components in the sidebar for active state styling

---

## Phase 6 — Query Option Factories

Standardize how queries are defined across domains:

- [ ] Each domain should export query option factories from a `queries.ts` file — functions that return `queryOptions({ queryKey, queryFn, ... })`
- [ ] These factories should be used in both components (`useSuspenseQuery(factory())`) and route loaders (`context.queryClient.ensureQueryData(factory())`)
- [ ] Mutations should be in a separate `mutations.ts` per domain
- [ ] Domain barrel exports (`index.ts`) should re-export: query option factories, mutation hooks, UI model types, and mappers

---

## Phase 7 — Component Layer Separation

Separate domain components from generic UI components:

- [ ] Create `src/components/ui/` for all generic, reusable components that have no knowledge of any domain — Modal, Drawer, Stepper, DataTable, FilterBar, ConfirmDialog, Pagination, SearchInput, etc.
- [ ] Domain-specific components stay in `src/domains/<domain>/components/` — these compose generic UI components but know about the domain's types, mutations, and queries
- [ ] Audit existing components: if a component doesn't import any domain types, queries, or mutations, move it to `src/components/ui/`
- [ ] Audit existing components: if a generic UI component has domain-specific logic hardcoded in it, extract the domain logic into a domain component that wraps the generic one
- [ ] For complex multi-step flows (creation wizards, onboarding), create a subfolder within the domain: `src/domains/<domain>/components/CreateWizard/` containing `WizardShell.tsx`, step components, and a `types.ts` for shared wizard context

---

## Phase 8 — Modals, Drawers, and Multi-Step Flows

Establish consistent patterns for overlay UI:

- [ ] **Simple modals** (confirmations, quick actions) — use component state (`useState`) to control open/close, no URL involvement
- [ ] **Detail drawers and edit panels** — use URL search params to control open state (e.g. `?editId=123`) so the state is shareable and back-button works
- [ ] **Multi-step wizards** — use child routes (e.g. `/templates/create/details`, `/templates/create/content`, `/templates/create/review`) so each step is a distinct URL, back/forward navigates steps, and refresh preserves position
- [ ] For multi-step child routes, shared wizard state lives in the parent layout component and is passed down via `useOutletContext`
- [ ] Apply the rule: if the user expects the back button to close it → URL state; if the user expects back to go to the previous page → component state

---

## Phase 9 — Reporting Pages and Filter Architecture

Standardize how interactive reporting/list pages handle filters and data fetching:

- [ ] Every filter that changes an API call must be a URL search param — not component state
- [ ] Each reporting/list route must have a `validateSearch` using a Zod schema that defines all filter params with sensible defaults
- [ ] Each reporting/list route must use `loaderDeps: ({ search }) => ({ search })` so the loader re-runs when filters change
- [ ] Query option factories for reporting endpoints must use `placeholderData: keepPreviousData` so the UI doesn't flash empty between filter changes
- [ ] Filter bar components should be **controlled** — they receive current filters as props and call an `onChange` that navigates (updates search params), they do not own filter state
- [ ] The `updateFilters` helper should reset pagination to page 1 when any non-pagination filter changes
- [ ] For text search inputs, debounce locally (300ms) before calling the navigation-based `onChange`
- [ ] Use `isFetching` from the query result to show subtle loading indicators (opacity fade, small spinner) rather than replacing content with a full loading state

---

## Phase 10 — Search Param Schema Generation from API Spec

Automate search param validation schemas from the OpenAPI spec:

- [ ] Review the current codegen tool and determine if it supports Zod schema output (e.g. Orval Zod mode, openapi-zod-client)
- [ ] If codegen supports Zod: configure the generator to output Zod schemas for each endpoint's query parameters alongside the existing API client and DTO output
- [ ] If codegen does not support Zod: create a `search-schemas.ts` file per domain that manually defines Zod schemas for query parameters, and use `satisfies z.ZodType<GeneratedParamsType>` to ensure the schema stays in sync with the generated types at compile time
- [ ] Route `validateSearch` functions should import and use these schemas directly — no hand-written inline validation in route files
- [ ] Ensure generated schemas include appropriate defaults (so the URL doesn't need every param to render a valid page)
- [ ] Add the schema generation step to the existing codegen script so it runs automatically when the API spec changes

---

## Phase 11 — Validation

After migration, verify:

- [ ] Cold load of an authenticated route while logged out → redirects to login with no flash of app UI
- [ ] OAuth flow completes and redirects back to the originally requested page
- [ ] 401 during normal usage → session invalidated, user redirected to login
- [ ] Hovering over `<Link>` components triggers route loaders and prefetches data
- [ ] No auth logic remains in Axios interceptors beyond token attachment and error typing
- [ ] No `useEffect`-based auth checks remain in any component
- [ ] No domain-specific logic exists in `src/components/ui/` — all generic
- [ ] No generic UI components are duplicated across domain folders
- [ ] All reporting/list page filters are URL search params, not component state
- [ ] Changing filters on reporting pages keeps previous data visible (no flash) with a subtle loading indicator
- [ ] Sharing a reporting page URL with filters reproduces the exact same view
- [ ] Multi-step wizards preserve their step on page refresh
- [ ] Browser back button closes drawers/panels that are URL-driven
- [ ] Search param Zod schemas match the generated API types (compile-time check passes)
