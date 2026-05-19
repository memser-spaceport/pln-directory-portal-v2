# PL Design System — AI Agent Instructions

This is the **Protocol Labs Design System** repository. It contains design tokens and React components extracted from Figma and implemented for use in Next.js 14 applications (primarily `pln-directory-portal-v2`).

---

## Project Overview

| Property | Value |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | SCSS CSS Modules + CSS custom properties |
| Component primitives | Radix UI (unstyled, accessible) |
| Token source | Figma — 4 design system files (see below) |

---

## Figma Source Files

Always extract tokens and components from these 4 files in order:

1. **Design System Foundations** — colors, typography, spacing primitives
   `https://www.figma.com/design/ajJidFJgQCsS9nzXbq6upe/Design-System-Foundations-|-Protocol-Labs`

2. **Design System Icons, Emojis, Avatars**
   `https://www.figma.com/design/apsV3GKbIbOSpZYGvhdKqU/Design-System-Icons-|-Protocol-Labsd`

3. **Design System Default Components** — base UI components (Button, Input, Badge, etc.)
   `https://www.figma.com/design/V7AhdMa4HXackrEpe8036f/Design-System-Default-Components-|-Protocol-Labsd`

4. **Design System Design Components** — composed/page-level components
   `https://www.figma.com/design/su9oMYFBgLwUcfKESSLis0/Design-System-Design-Components-|-Protocol-Labsd`

To extract tokens from a file, use the Figma MCP tool `get_variable_defs` with the node id from the URL.
To extract a specific component, use `get_design_context` with its node id.

---

## Token System

Tokens live in `tokens/` and are imported globally via `tokens/index.scss`.

| File | Contents |
|---|---|
| `tokens/colors.scss` | All color tokens (background, foreground, border, action, neutral palette) |
| `tokens/typography.scss` | Font family, weight variables + SCSS mixins for all text styles |
| `tokens/spacing.scss` | Spacing scale, border radius, shadows, z-index, layout |
| `tokens/index.scss` | Entry point — `@use` all token files |

### Token naming convention
CSS custom properties follow Figma's token path with `/` replaced by `-`:

```
Figma: background/brand/default  →  CSS: --background-brand-default
Figma: foreground/neutral/primary  →  CSS: --foreground-neutral-primary
Figma: spacing/md  →  CSS: --spacing-md
Figma: corner radius/lg  →  CSS: --radius-lg
```

Legacy `--plaa-*` names are aliased in `tokens/colors.scss` for backward compatibility with `pln-directory-portal-v2`.

---

## Component Architecture

### File structure per component
```
components/
└── Button/
    ├── Button.tsx          # Component implementation
    ├── Button.module.scss  # Scoped styles using token variables
    ├── Button.types.ts     # TypeScript prop types/interfaces
    └── index.ts            # Public export
```

### Rules
- **Always use CSS custom properties** from `tokens/` — never hardcode colors, spacing, or font sizes.
- **Use Radix UI primitives** for interactive components that need accessibility (dialogs, dropdowns, popovers, tooltips, checkboxes, switches, selects).
- **Mark `"use client"`** only on components that use Radix primitives, hooks, or browser APIs. Presentational components must stay as Server Components.
- **Never use Tailwind** — this project uses SCSS modules exclusively.
- **Never use inline styles** except for dynamic values that can't be expressed in CSS (e.g. width set from JS).
- Use `clsx` for conditional class names.

### Responsive patterns
Use breakpoint mixins from `styles/media.scss`:

```scss
@use 'styles/media';

.container {
  padding: var(--spacing-md);

  @include media.tablet-landscape {
    padding: var(--spacing-xl);
  }
}
```

---

## Styling Reference

### Color usage
```scss
// ✅ Correct — use tokens
color: var(--foreground-neutral-primary);
background: var(--background-brand-default);
border: 1px solid var(--border-neutral-subtle);

// ❌ Wrong — hardcoded values
color: #0a0c11;
background: #1b4dff;
```

### Typography usage
```scss
@use 'tokens/typography';

.title {
  @include typography.heading-md;
}

.description {
  @include typography.body-sm;
  color: var(--foreground-neutral-secondary);
}
```

### Spacing usage
```scss
// ✅ Use spacing tokens
padding: var(--spacing-md) var(--spacing-xl);
gap: var(--spacing-sm);
border-radius: var(--radius-md);
```

---

## Adding a New Component from Figma

1. Open the Figma file containing the component.
2. Call `get_design_context` with the component's node id.
3. Create `components/<ComponentName>/` directory.
4. Implement the component using:
   - Radix UI primitive if it's interactive (check Radix docs)
   - Token-based CSS custom properties only
   - SCSS module for styles
   - TypeScript props interface in `*.types.ts`
5. Export from `components/<ComponentName>/index.ts`.
6. Add a showcase page in `src/app/<component-name>/page.tsx`.

---

## Adding / Updating Tokens from Figma

1. Open the relevant Figma file in Figma Desktop.
2. Call `get_variable_defs` (no nodeId needed if the file is the active tab).
3. Update the corresponding file in `tokens/`:
   - Colors → `tokens/colors.scss`
   - Typography → `tokens/typography.scss`
   - Spacing/radius/shadow → `tokens/spacing.scss`
4. Update the comment at the top of the file with the extraction date.
5. If a token was renamed in Figma, add a backward-compat alias before removing the old name.

---

## Project Structure

```
pl-design-system/
├── CLAUDE.md                   # This file
├── DESIGN.md                   # Design intent, principles, component guidelines
├── DESIGNER_REVIEW.md          # Open items requiring designer sign-off
├── tokens/                     # Design tokens (source of truth from Figma)
│   ├── colors.scss
│   ├── typography.scss
│   ├── spacing.scss
│   └── index.scss
├── styles/                     # Shared SCSS utilities
│   ├── globals.scss            # Global reset + token import + @font-face
│   ├── media.scss              # Responsive breakpoint mixins
│   └── mixins.scss             # Layout/typography helpers
├── components/                 # Design system components (33 components)
├── mockups/                    # Page-level reference compositions (not reusable)
├── assets/
│   ├── logos/                  # pl-mark.svg, pl-wordmark.svg (currentColor, transparent)
│   └── icons/                  # 32 Phosphor SVGs (regular weight, standalone)
├── public/
│   └── fonts/                  # Self-hosted Inter variable font
│       ├── InterVariable.woff2
│       └── Inter-VariableFont_opsz_wght.ttf
├── scripts/
│   └── extract-icons.mjs       # Regenerates assets/icons/ from @phosphor-icons/react
├── src/
│   └── app/                    # Next.js App Router showcase
│       ├── layout.tsx          # next/font/local loads InterVariable.woff2
│       ├── page.tsx            # Component gallery index
│       └── templates/          # Showcase page templates
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `sass` | SCSS compilation |
| `clsx` | Conditional class names |
| `@radix-ui/react-dialog` | Modal/dialog primitive |
| `@radix-ui/react-popover` | Popover primitive |
| `@radix-ui/react-select` | Select dropdown primitive |
| `@radix-ui/react-tooltip` | Tooltip primitive |
| `@radix-ui/react-checkbox` | Checkbox primitive |
| `@radix-ui/react-switch` | Toggle switch primitive |
| `framer-motion` | Animations |
| `@phosphor-icons/react` | Icon library — use `Ph<IconName>` imports, e.g. `import { PhBell } from '@phosphor-icons/react'` |

---

## Static Assets

### Font
Inter variable font is **self-hosted** in `public/fonts/`. Do **not** import from Google Fonts CDN.

| File | Note |
|---|---|
| `public/fonts/InterVariable.woff2` | Primary web font (loaded via `next/font/local`) |
| `public/fonts/Inter-VariableFont_opsz_wght.ttf` | Fallback for Storybook / non-browser envs |

`src/app/layout.tsx` loads the woff2 via `next/font/local` and exposes `--font-inter`.
`styles/globals.scss` declares a `@font-face` fallback covering both files.
`tokens/typography.scss` references `var(--font-inter, 'Inter', ...)` so both paths work.

### Icons
Import from `@phosphor-icons/react`:

```tsx
import { PhMagnifyingGlass, PhBell, PhCaretDown } from '@phosphor-icons/react';

<PhBell size={16} />               // regular weight (default)
<PhBell size={16} weight="fill" /> // filled
```

A standalone SVG subset (32 icons, regular weight) is exported to `assets/icons/` for non-React contexts.
Run `node scripts/extract-icons.mjs` to regenerate after upgrading `@phosphor-icons/react`.

### Logos
Placeholder SVG files are in `assets/logos/`. Replace path data with official assets from Figma before production use.

| File | ViewBox | Use case |
|---|---|---|
| `assets/logos/pl-mark.svg` | 48×48 | Icon-only (favicon, compact NavBar) |
| `assets/logos/pl-wordmark.svg` | 172×40 | Full lockup |

Both use `currentColor` and transparent backgrounds.
