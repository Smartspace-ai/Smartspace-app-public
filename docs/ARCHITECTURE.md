# Architecture Overview

This document describes the architecture for the Smartspace UI-v2 migration.

## Layers

- **platform/** → Core setup: theming, router, api config, providers.
- **features/** → Feature-first folders: messages, comments, workspaces.
- **shared/** → Reusable components, utilities, types.
- **docs/** → PROGRESS.md, ARCHITECTURE.md, README.md

## Data Flow

1. **TanStack Router** manages routes + params.
2. **React Query** handles fetching and caching.
3. **Zod** validates server responses and enforces runtime safety.
4. **MUI Theme** provides consistent design system.

## Rules

- Features never import other features.
- Shared code lives in `shared/`.
- Keep queries colocated with their feature.
- Use MSW for consistent local/dev testing.

## Example File Tree

```
platform/
  theme/
  router/
  api/
features/
  messages/
    components/
    hooks/
    service.ts
    queryKeys.ts
shared/
  components/
  utils/
  types/
docs/
  PROGRESS.md
  ARCHITECTURE.md
```

