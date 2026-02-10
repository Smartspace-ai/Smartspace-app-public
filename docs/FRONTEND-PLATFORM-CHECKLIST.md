# Frontend Platform Implementation Checklist

## 🎯 Goal

Build a scalable, secure, multi-region, observable, design-system-driven frontend platform using:

- React
- MUI
- TanStack Router
- TanStack Query
- Zod
- React Hook Form
- Suspense
- CSS variables
- Semantic tokens

No raw styling. No entropy. No random architecture decisions.

---

# 1️⃣ Design System & Theming

## Phase 1 — Scaffold Theme Architecture

### Folder Structure

```
src/theme/
  tokens/
    core.colors.ts
    semantic.light.ts
    semantic.dark.ts
    typography.ts
    spacing.ts
    radii.ts
    motion.ts
    elevation.ts
    breakpoints.ts
    zIndex.ts
  mui/
    createTheme.ts
    components/
  contracts/
    theme.schema.json
    README.theming.md
```

---

## Core Tokens

- Define color ramps only (gray, brand, success, danger, warning, info).
- No component should use these directly.

---

## Semantic Tokens

### Background

- bg.canvas
- bg.surface
- bg.elevated
- bg.overlay

### Text

- text.primary
- text.secondary
- text.muted
- text.inverse
- text.disabled

### Actions

- action.primary (main, hover, active, disabled, focus)
- action.secondary
- action.danger
- action.success

### Borders

- border.subtle
- border.default
- border.strong
- border.focus

### Feedback

- state.error.bg
- state.error.text
- state.success.bg
- state.warning.bg
- state.info.bg

---

## Typography

- All font sizes in `rem`
- Use `clamp()` for fluid scaling
- Define: display, h1–h6, bodyLg, body, bodySm, caption, mono

---

## Spacing

- Choose 4px or 8px grid
- No raw px values
- Define spacing scale tokens

---

## Motion

Define:

- motion.fast
- motion.normal
- motion.slow
- easing.standard
- easing.decelerate

All transitions must use these tokens.

---

## Elevation

Define shadow levels:

- elevation.0–5
- Dark mode shadow adjustments

---

## Radius

Define:

- radius.none
- radius.sm
- radius.md
- radius.lg
- radius.full

No hardcoded border-radius.

---

## Z-Index

Define:

- z.appBar
- z.drawer
- z.modal
- z.tooltip
- z.toast

---

## Rules

- ❌ No raw hex values in components
- ❌ No hardcoded px
- ❌ No inline random transitions
- ✅ Components consume semantic tokens only

---

# 2️⃣ Suspense & Loading Architecture ✅ (Phase 2 implemented)

## Route-Level Loading

- Each route exports:

  - Pending (PageSkeleton)
  - Error
  - NotFound

- Use lazy route loading.
- **Done:** Root has `pendingComponent` (TeamsLoader), `errorComponent`; workspace layout wraps `<Outlet />` in `<Suspense fallback={<PageSkeleton />}>`.

---

## Section-Level Suspense

- Wrap major sections in `<Suspense>`
- Each section has its own skeleton.

---

## Skeleton Structure ✅

```
src/ui/feedback/
  Skeletons/
    PageSkeleton.tsx   ✅
    ListSkeleton.tsx   ✅
    DetailsSkeleton.tsx ✅
    TableSkeleton.tsx   ✅
  index.ts
```

Rules:

- Skeleton matches final layout size.
- Prefer skeletons over spinners.
- Avoid layout shift.

---

## Inline Loading

- Button loading states
- Row shimmer on mutation
- Optimistic updates where safe

---

# 3️⃣ Forms Architecture (Zod + React Hook Form) ✅

## Structure ✅

```
src/forms/
  core/
    serverErrors.ts   — normalizeToAppError, mapServerErrorToForm (400→field, 401/403→auth, 409→root, 5xx→root+log)
    index.ts
  components/
    FormField.tsx     — label, error, aria-invalid, aria-describedby
    index.ts
  patterns/
    focusFirstInvalid.ts — focusFirstInvalidField(errors), fieldPathToId
    threadRenameSchema.ts — Zod schema + ThreadRenameFormValues
    index.ts
  index.ts
```

---

## Validation Layers

### Sync Validation (Zod)

- Required
- Format
- Cross-field rules

### Async Field Validation

- Debounced
- Cancel stale requests
- Show field loading state

### Submit Validation

- Backend authoritative
- Map server errors to fields

---

## Error Handling Policy

- 400 validation → field errors
- 401/403 → auth handler
- 409 → conflict message
- 5xx → global error + log

---

## Accessibility

- aria-invalid
- aria-describedby
- Focus first invalid field
- Proper label association

---

# 4️⃣ Error Handling & Observability

## Global Error Boundary

- Wrap app with error boundary
- Capture unexpected errors

---

## Sentry Integration

- Initialize once at app startup
- Capture:

  - runtime exceptions
  - rejected promises
  - route transitions
  - slow transactions

- Add context:

  - user id (if allowed)
  - route
  - feature flags

- Strip PII

---

## Logging Strategy

Track:

- Route transitions
- Mutation failures
- Auth expiry
- Feature flag exposure

---

# 5️⃣ Dependency Hygiene

## Dependabot

- Enable weekly updates
- Enable security alerts
- Limit open PRs
- Review regularly

---

## CI

- Run dependency audit in CI
- Fail build on high-severity issues (optional strict mode)

---

# 6️⃣ State & URL Philosophy

## URL as Source of Truth

If shareable/bookmarkable:

- filters
- sorting
- pagination
- selected tabs

It belongs in URL.

---

## Client State

Define:

- When to use local state
- When to use context
- Avoid cross-feature leakage

---

# 7️⃣ Internationalization (Multi-Region)

## Translation System

- Use key-based translations
- Namespace per feature
- Lazy-load locale bundles

---

## Formatting

- Use Intl API for:

  - dates
  - numbers
  - currency
  - pluralization

---

## Time Zones

- Store in UTC
- Convert at render time

---

## RTL Readiness

- Avoid left/right CSS
- Use logical properties
- Ensure layout does not assume LTR

---

# 8️⃣ Security Layer

## Token Storage

Prefer:

- HTTP-only cookies

Avoid:

- long-lived refresh tokens in localStorage

---

## XSS Protection

- No unsafe HTML injection
- Sanitize markdown
- Escape user content

---

## CSP

Define:

- script-src
- style-src
- connect-src
- frame-src

---

## Role-Based UI

- Hide restricted UI
- Backend enforces real permissions

---

# 9️⃣ Performance Architecture

- Route-based code splitting
- Lazy feature loading
- Avoid unnecessary renders
- Virtualize large lists
- Memoize expensive components
- Stable query keys

---

# 🔟 Micro-Interaction System

Define global motion philosophy:

- Hover duration
- Press duration
- Page transition animation
- Focus ring animation

Apply consistently across:

- Buttons
- Dialogs
- Drawers
- Tabs
- Lists

Avoid flashy animations.

Prioritize:

- clarity
- feedback
- smoothness

---

# 1️⃣1️⃣ Accessibility Standards

- Keyboard navigable
- Visible focus ring
- 44px touch targets
- ARIA roles correct
- Screen reader announcements for dynamic content

---

# 1️⃣2️⃣ Feature Architecture

- Feature-first folder structure
- No cross-feature imports
- Shared components centralized
- Tests per feature

---

# 1️⃣3️⃣ Enforcement ✅

## Add ESLint Rules ✅

- Disallow raw hex — `no-restricted-syntax` (warn; excluded in `src/theme/tokens/core.colors.ts`)
- Disallow px font sizes — `no-restricted-syntax` for `fontSize` + `px` (warn)
- Disallow inline transitions — `no-restricted-syntax` for `transition` Literal (warn)
- Disallow direct palette usage — document in README.theming.md; optional rule later

---

## CI Enforcement

- Lint must pass
- Types must pass
- Tests must pass
- Optional: audit check

---

# Final Standard

The system is complete when:

- All components use semantic tokens
- No raw styling exists
- Suspense boundaries are intentional
- Forms follow consistent pattern
- Errors are normalized
- Sentry captures runtime failures
- Dependencies auto-update
- i18n is possible without rewrite
- RTL would not break layout
- Motion feels consistent
