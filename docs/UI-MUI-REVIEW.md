# UI implementation review: MUI and design system

## Summary

The app uses **MUI** for layout and components alongside **Tailwind** and **CSS variables** from `_theme.scss`. A **token-based MUI theme** was added in `src/theme/mui/createTheme.ts` and is the one provided to `ThemeProvider`, but most UI still relies on Tailwind classes and CSS vars. This leads to **two parallel styling sources** and mixed patterns.

---

## 1. Theme and styling sources

| Source                                          | Used by                              | Purpose                                                                                             |
| ----------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **`src/theme/mui/createTheme.ts`** (`appTheme`) | `AppProviders` → MUI `ThemeProvider` | MUI palette, typography, shape, components. Built from `src/theme/tokens` (semantic light/dark).    |
| **`_theme.scss`**                               | Tailwind classes, some mui-compat    | CSS vars: `--primary`, `--background`, `--foreground`, `--muted`, `--border`, `--destructive`, etc. |

_Removed: `src/shared/ui/mui-bridge/theme.ts` was dead (replaced by `appTheme`)._

**Implication:** Components using **Tailwind** (e.g. `bg-primary`, `text-foreground`, `border-input`) read from CSS vars. Components using **MUI `sx`** or theme (e.g. `palette.primary.main`, `borderColor: 'divider'`) use the token-based theme. Values are aligned in practice (e.g. brand #6443f4) but there is **no single source of truth** and no guarantee they stay in sync (e.g. dark mode, whitelabel).

---

## 2. MUI usage patterns

### 2.1 Shared layer: `src/shared/ui/mui-compat/`

| File                  | Actually uses MUI?                                                  | Styling                                                      |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| **button.tsx**        | **No** — Radix Slot + CVA + Tailwind                                | Tailwind only                                                |
| **dialog.tsx**        | Yes — Dialog, DialogActions, DialogContent, DialogTitle, IconButton | Mix: `sx` (hardcoded rgba, maxWidth), `className` (Tailwind) |
| **input.tsx**         | Yes — InputBase                                                     | Tailwind (border-input, ring-ring, etc.)                     |
| **label.tsx**         | Yes — InputLabel                                                    | Tailwind + `sx={{ color: 'hsl(var(--foreground))' }}`        |
| **skeleton.tsx**      | Yes — Skeleton                                                      | Tailwind + `sx={{ backgroundColor: "hsl(var(--muted))" }}`   |
| **sheet.tsx**         | Yes — Drawer, IconButton                                            | CVA + Tailwind                                               |
| **sidebar.tsx**       | No MUI primitives; uses Button, Sheet, Tooltip from mui-compat      | Tailwind                                                     |
| **avatar.tsx**        | Yes — MuiAvatar                                                     | —                                                            |
| **breadcrumb.tsx**    | Yes — Breadcrumbs, Link                                             | —                                                            |
| **card.tsx**          | Yes — Card                                                          | —                                                            |
| **dropdown-menu.tsx** | Yes — Menu, MenuItem                                                | —                                                            |
| **popover.tsx**       | Yes — Popover                                                       | —                                                            |
| **scroll-area.tsx**   | Radix                                                               | —                                                            |
| **separator.tsx**     | Yes — Divider                                                       | —                                                            |
| **switch.tsx**        | Yes — MuiSwitch                                                     | —                                                            |
| **tooltip.tsx**       | Yes — MuiTooltip                                                    | —                                                            |

**Findings:**

- **Naming:** The directory is called `mui-compat` but several exports are not MUI (e.g. Button, parts of sidebar). Name suggests “MUI compatibility layer” but it’s really a **mixed shared UI** layer (MUI + Radix + CVA).
- **Styling:** Mix of Tailwind, `sx` with theme keys (e.g. `borderColor: 'divider'`), and hardcoded values (e.g. `rgba(0,0,0,0.8)`, `maxWidth: '425px'`, `hsl(var(--...))`). Not fully aligned with the “semantic tokens only” rule in the checklist.

### 2.2 Direct `@mui/material` imports (outside mui-compat)

| Location                    | Components used                                                    |
| --------------------------- | ------------------------------------------------------------------ |
| **MessageComposer.tsx**     | MuiButton, IconButton (and mui-compat Button as `UIButton`)        |
| **MessageBubble.tsx**       | Button                                                             |
| **chat-header.tsx**         | Divider, Skeleton                                                  |
| **mention-input.tsx**       | Multiple (e.g. TextField, Popper)                                  |
| **WorkspaceSwitcher.tsx**   | Skeleton                                                           |
| **chat-variables/renders/** | Autocomplete, TextField; FormControl, InputLabel, MenuItem, Select |
| **ui/feedback/Skeletons/**  | Box, Skeleton                                                      |

**Findings:**

- **Inconsistent entry point:** Some screens use **mui-compat** (e.g. Dialog, Input, Label in ThreadRenameModal), others use **raw MUI** (MessageComposer, chat-header, WorkspaceSwitcher, chat-variables). No enforced rule (“use compat when it exists” vs “use MUI when you need it”).
- **Skeletons:** New `PageSkeleton` / `ListSkeleton` etc. use MUI `Box` + `Skeleton` with theme (`sx` with `borderColor: 'divider'`, spacing). The shared **mui-compat/skeleton** uses CSS var `hsl(var(--muted))`. So skeleton styling is split between theme and CSS vars.

---

## 3. Alignment with design system checklist

From `docs/FRONTEND-PLATFORM-CHECKLIST.md` and `src/theme/contracts/README.theming.md`:

- **“No raw hex in components”** — Violated in several places (e.g. dialog backdrop `rgba(0,0,0,0.8)`, and any remaining hex in ui/ or shared/).
- **“No hardcoded px”** — Dialog/sheet use `maxWidth: '425px'`, `width: 280` in PageSkeleton, etc.
- **“Components consume semantic tokens only”** — Many components consume **Tailwind/CSS vars** (e.g. `bg-primary`, `border-input`) or **raw MUI theme** (e.g. `borderColor: 'divider'`). Semantic tokens are used in the MUI theme but not exposed as a single contract for Tailwind.
- **“All transitions must use motion tokens”** — mui-compat button uses Tailwind `transition-colors`; no use of `theme/../motion` in compat layer.

So: **design system rules are only partially applied**; the MUI theme is token-driven, but the rest of the UI is still Tailwind/CSS vars and ad-hoc values.

---

## 4. Recommendations

### 4.1 Short term (clarify and document)

1. **Remove or repurpose dead theme**

   - **Option A:** Delete `src/shared/ui/mui-bridge/theme.ts` if nothing imports it.
   - **Option B:** Keep only if you plan to use it for a separate “whitelabel” build; then document that and the intended usage.

2. **Document the two systems**

   - In `docs/` or `theme/contracts/`: state that **MUI components** get their look from `appTheme` (tokens), and **Tailwind/class-based** UI from `_theme.scss` CSS vars.
   - Note that token values and CSS var values are kept in sync manually (e.g. same primary); document where (e.g. `core.colors` vs `$primary-hex`).

3. **Decide and document “MUI vs mui-compat”**
   - Either: “Prefer mui-compat when a wrapper exists; use raw MUI only when necessary (e.g. Autocomplete, complex controls).”
   - Or: “Use MUI directly and rely on theme; mui-compat is legacy.”
   - Add this to a short “UI / MUI” section in the checklist or in this review so future changes are consistent.

### 4.2 Medium term (align with design system)

4. **Prefer theme over hardcoded values in MUI usage**

   - In **dialog.tsx** and **sheet.tsx**: replace hardcoded `rgba(0,0,0,0.8)` and `maxWidth: '425px'` with theme values (e.g. `theme.palette.action.selected` or a semantic overlay, and `theme.breakpoints` or a custom spacing/token if you add one for modal width).
   - In **mui-compat/skeleton**: consider using theme (e.g. `theme.palette.action.hover` or a semantic “muted” in the theme) instead of `hsl(var(--muted))` so all MUI-derived components use one source.

5. **Unify skeleton styling**

   - Either: make **mui-compat/skeleton** use theme (no CSS var), and keep **PageSkeleton** etc. on theme as they are.
   - Or: introduce a shared “Skeleton” from mui-compat and use it in feedback/Skeletons so one component owns the look (theme or vars, but not both).

6. **Reduce direct MUI in feature UI**
   - Where possible, use **mui-compat** (or a thin wrapper) for Button, Divider, Skeleton in **chat-header**, **MessageComposer**, **MessageBubble**, **WorkspaceSwitcher** so styling and behavior go through one layer and can be switched to tokens later without touching every screen.

### 4.3 Longer term (single source of truth)

7. **Drive Tailwind from the same tokens**

   - If you want “no raw styling” and “semantic tokens only” everywhere: define semantic tokens (e.g. in theme or a small token module) and either:
     - Generate CSS vars from those tokens and keep using Tailwind with those vars, or
     - Use Tailwind’s theme in `tailwind.config` that reads from the same token set.
   - That way MUI theme and Tailwind both consume the same semantic layer.

8. **Rename or split mui-compat**
   - Rename to something like `shared/ui/primitives` or split into `shared/ui/mui-wrappers` (Dialog, Input, Sheet, Skeleton, etc.) and `shared/ui/radix-wrappers` (Button, etc.) so it’s clear what is MUI-based vs not.

---

## 5. File-level snapshot (for follow-up)

- **Theme:** `src/theme/mui/createTheme.ts` ✅ token-based (mui-bridge removed).
- **App wiring:** `AppProviders.tsx` uses `appTheme` from `@/theme/mui/createTheme` ✅.
- **Compat:** 16 files in `mui-compat`; Button is Radix+CVA; Dialog, Input, Label, Sheet, Skeleton mix MUI + Tailwind/sx; some hardcoded values.
- **Direct MUI:** MessageComposer, MessageBubble, chat-header, mention-input, WorkspaceSwitcher, chat-variables renderers, feedback/Skeletons — all import `@mui/material` directly.

This review should be enough to decide the short-term cleanup (dead theme, docs, MUI vs compat rule) and then iterate on token alignment and a single source of truth when you’re ready.
