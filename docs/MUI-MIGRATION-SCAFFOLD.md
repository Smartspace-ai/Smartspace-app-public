# MUI migration scaffold — component-by-component

Use this as the **single checklist** for migrating the UI to MUI + design tokens. Do **one component per task** so Cursor (or you) doesn’t get lost; the scaffold is the map.

---

## Is the setup correct for migration?

**Yes.** You’re ready to migrate UI to MUI in small steps.

| Piece                    | Status                                                                         | Where                                           |
| ------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| **MUI theme**            | ✅ Token-based, used app-wide                                                  | `src/theme/mui/createTheme.ts` → `AppProviders` |
| **Design tokens**        | ✅ Semantic light/dark, typography, spacing, motion, etc.                      | `src/theme/tokens/`                             |
| **ThemeProvider**        | ✅ Wraps app                                                                   | `AppProviders.tsx` uses `appTheme`              |
| **StyledEngineProvider** | ✅ `injectFirst` so Tailwind and MUI don’t clash                               | `AppProviders.tsx`                              |
| **Compat layer**         | ✅ Wrappers exist; migrate them to use theme, then migrate screens to use them | `src/shared/ui/mui-compat/`                     |

Migration = **replace Tailwind/CSS vars with theme tokens** and **use MUI/compat consistently**, one component at a time.

---

## How to migrate one component (pattern)

For each row below, do this in order:

1. **Open only the file(s) listed** for that row.
2. **Replace styling** with theme-driven styling:
   - Prefer **`sx`** with theme keys: `sx={{ color: 'text.primary', borderColor: 'divider', bgcolor: 'background.paper' }}` or use `theme => ({ ... })` if you need spacing/breakpoints.
   - Use **`theme.spacing(n)`** instead of raw px or Tailwind spacing where you’re in MUI components.
   - Use **semantic tokens** from the theme (no raw hex, no `hsl(var(--...))` in new code).
3. **Keep behavior and props** the same; only change styling and, if needed, swap a raw MUI import for the compat wrapper.
4. **Run lint** (and typecheck if you want) after that one component.
5. **Check the row off** and go to the next row.

If a component is **“align to theme”**, the file already uses MUI; just replace hardcoded colors/px with theme tokens. If it’s **“use MUI/compat”**, replace custom or raw MUI usage with the shared wrapper and theme.

---

## Scaffold: migration order

Do these in order. One row = one focused task.

### Phase 1 — Shared primitives (mui-compat)

Align these to theme tokens so every screen that uses them benefits.

| #   | Component | Path                                    | Task                                                                                                                                                                                                          |
| --- | --------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Dialog    | `src/shared/ui/mui-compat/dialog.tsx`   | ✅ Done. Backdrop: `alpha(theme.palette.common.black, 0.8)`; Paper: `maxWidth: theme.spacing(53)`, theme-driven.                                                                                              |
| 1.2 | Input     | `src/shared/ui/mui-compat/input.tsx`    | ✅ Done. Replaced Tailwind with `sx` using `theme.palette`, `theme.shape`, `theme.spacing`.                                                                                                                   |
| 1.3 | Label     | `src/shared/ui/mui-compat/label.tsx`    | ✅ Done. `sx={(theme) => ({ color: theme.palette.text.primary })}`.                                                                                                                                           |
| 1.4 | Skeleton  | `src/shared/ui/mui-compat/skeleton.tsx` | ✅ Done. `sx` uses `theme.palette.action.hover`, `theme.shape.borderRadius`.                                                                                                                                  |
| 1.5 | Sheet     | `src/shared/ui/mui-compat/sheet.tsx`    | ✅ Done. SheetOverlay + Drawer backdrop: `alpha(theme.palette.common.black, 0.8)`; Paper: `sx` with `background.paper`, `divider`, `shadows[4]`, `theme.spacing`; IconButton position via `theme.spacing(1)`. |
| 1.6 | Button    | `src/shared/ui/mui-compat/button.tsx`   | Deferred: Radix+CVA + Tailwind (CSS vars). Variants align with theme via `_theme.scss`; no code change this phase.                                                                                            |

### Phase 2 — Layout

| #   | Component         | Path                                                        | Task                                                                                                 |
| --- | ----------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 2.1 | SidebarLeft       | `src/ui/layout/SidebarLeft.tsx`                             | Use theme for text/divider (e.g. `color: 'text.secondary'`) instead of Tailwind `text-gray-500` etc. |
| 2.2 | SidebarUserHeader | `src/ui/layout/SidebarUserHeader.tsx`                       | Same: theme for colors and typography.                                                               |
| 2.3 | Workspace layout  | `src/routes/_protected/workspace/$workspaceId/__layout.tsx` | Only if you add layout chrome here; otherwise skip.                                                  |

### Phase 3 — Header & global chrome

| #   | Component          | Path                                    | Task                                                                                                                                                                      |
| --- | ------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | ChatHeader         | `src/ui/header/chat-header.tsx`         | Replace raw `Divider`/`Skeleton` with mui-compat if you add wrappers, or keep MUI and style with `sx` from theme; replace `text-gray-500`, `text-destructive` with theme. |
| 3.2 | NotificationsPanel | `src/ui/header/notifications-panel.tsx` | Use theme tokens for list/chip styling.                                                                                                                                   |

### Phase 4 — Messages

| #   | Component                       | Path                                  | Task                                                                                                       |
| --- | ------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 4.1 | MessageComposer                 | `src/ui/messages/MessageComposer.tsx` | Use mui-compat Button (or MUI Button with theme); remove duplicate MuiButton/IconButton or align to theme. |
| 4.2 | MessageBubble                   | `src/ui/messages/MessageBubble.tsx`   | Replace MUI Button with mui-compat Button; style with theme.                                               |
| 4.3 | MessageList                     | `src/ui/messages/MessageList.tsx`     | Use theme for container/scroll if any Tailwind there.                                                      |
| 4.4 | MessageItem, MessageImage, etc. | `src/ui/messages/*.tsx`               | Per-file: replace Tailwind color/spacing with theme where it’s MUI or compat.                              |

### Phase 5 — Threads

| #   | Component         | Path                                   | Task                                                                                      |
| --- | ----------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| 5.1 | ThreadsList       | `src/ui/threads/ThreadsList.tsx`       | Theme for list and empty state.                                                           |
| 5.2 | ThreadItem        | `src/ui/threads/ThreadItem.tsx`        | Theme for text and hover/selected.                                                        |
| 5.3 | NewThreadButton   | `src/ui/threads/NewThreadButton.tsx`   | Use mui-compat Button + theme.                                                            |
| 5.4 | ThreadRenameModal | `src/ui/threads/ThreadRenameModal.tsx` | Already uses compat Dialog/Input/FormField; ensure Dialog/Input use theme (from Phase 1). |

### Phase 6 — Workspaces

| #   | Component         | Path                                      | Task                                                                        |
| --- | ----------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| 6.1 | WorkspaceSwitcher | `src/ui/workspaces/WorkspaceSwitcher.tsx` | Replace raw Skeleton with mui-compat Skeleton; use theme for dropdown/chip. |

### Phase 7 — Chat variables & complex controls

| #   | Component         | Path                                                  | Task                                                                    |
| --- | ----------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| 7.1 | VariablesForm     | `src/ui/chat-variables/VariablesForm.tsx`             | Use theme for layout and labels.                                        |
| 7.2 | model-id-renderer | `src/ui/chat-variables/renders/model-id-renderer.tsx` | Autocomplete/TextField: style with `sx` from theme; replace any hex/px. |
| 7.3 | dropdown-renderer | `src/ui/chat-variables/renders/dropdown-renderer.tsx` | FormControl, Select: theme for colors and spacing.                      |
| 7.4 | Other renderers   | `src/ui/chat-variables/renders/*.tsx`                 | Same pattern: theme for colors and typography.                          |

### Phase 8 — Comments / secondary UI

| #   | Component     | Path                                     | Task                                                                                          |
| --- | ------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| 8.1 | mention-input | `src/ui/comments_draw/mention-input.tsx` | Replace raw MUI usage with theme-driven `sx`; consider compat if you add a TextField wrapper. |
| 8.2 | sidebar-right | `src/ui/comments_draw/sidebar-right.tsx` | Skeleton and layout: use theme.                                                               |

### Phase 9 — Feedback & skeletons

| #   | Component                                    | Path                                         | Task                                                                                                             |
| --- | -------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 9.1 | PageSkeleton                                 | `src/ui/feedback/Skeletons/PageSkeleton.tsx` | Already uses MUI Box/Skeleton; ensure all `sx` use theme (e.g. `borderColor: 'divider'`) and spacing from theme. |
| 9.2 | ListSkeleton, DetailsSkeleton, TableSkeleton | `src/ui/feedback/Skeletons/*.tsx`            | Same: theme only, no raw px for spacing if you can use `theme.spacing`.                                          |

### Phase 10 — Pages & root

| #    | Component   | Path                                     | Task                                                                                        |
| ---- | ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 10.1 | Chat page   | `src/pages/WorkspaceThreadPage/chat.tsx` | Stack and layout: use theme for background/gradient if you move away from Tailwind classes. |
| 10.2 | TeamsLoader | `src/pages/teams_loader.tsx`             | Optional: use theme for background and text.                                                |
| 10.3 | Login       | `src/pages/Login/Login.tsx`              | Form and layout with theme.                                                                 |

---

## After each component

- **Lint:** `nx lint smartspace --quiet`
- **Visual check:** Run the app and open the screen that uses that component.
- **Check off** the row in this doc (or in a copy) so the next task is unambiguous.

---

## Optional: Cursor instructions for “do one component”

You can paste something like this when you want Cursor to do the next step:

```text
Migrate the next MUI migration task from docs/MUI-MIGRATION-SCAFFOLD.md.
- Open the scaffold and find the first unchecked row in Phase X.
- Apply the “How to migrate one component” pattern to only that file.
- Use theme tokens (sx with theme keys, theme.spacing, palette) and no raw hex/px.
- Do not change other files except that one component (and its direct compat if the task says so).
```

That keeps each run focused on one component so the model doesn’t get lost.
