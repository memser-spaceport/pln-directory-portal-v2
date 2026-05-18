# Design System Guidelines for AI Agents

## Core Rule

**Always use canonical Figma components first.**

Before generating any UI element, search the Figma library for the matching canonical component. If it exists, instantiate it — do not recreate it.

---

## Forbidden Behavior

Do NOT do any of the following:

- Recreate components manually using raw HTML/CSS/JSX
- Detach instances from the Figma library unless explicitly instructed
- Flatten or redraw icons
- Draw custom buttons, cards, inputs, badges, modals, tabs, tables, dropdowns, or sidebars
- Invent new component variants that do not exist in Figma
- Hardcode colors, typography, radius, shadows, spacing, or borders — always use tokens
- Use page screenshots as component sources
- Use product page examples as primitive sources
- Approximate a missing component — stop and report instead

---

## Retrieval Order

When generating UI, retrieve components in this order:

1. **Primitive Components** — Button, Input, Badge, Checkbox, etc.
2. **Product / Composite Components** — Cards, Headers, Sidebars, etc.
3. **Layout Patterns** — Grid, Sidebar, Stack, etc.
4. **Page Examples** — structural reference only
5. **Foundations / Styles** — only when assembling layout that needs tokens directly

See `/figma/retrieval-priority.md` for full explanation.

---

## Missing Component Behavior

If the required component cannot be found in the Figma library:

1. Stop generation
2. Do not approximate or invent
3. Output exactly:

```
Missing canonical component: [component name]
```

Then ask for confirmation before proceeding.

---

## Token Usage

All visual values must come from the token system:

| Value type | Source |
|---|---|
| Colors | `--foreground-*`, `--background-*`, `--border-*` tokens |
| Typography | `--type-*` tokens or `@include mixins.*` |
| Spacing | `--spacing-*` tokens |
| Radius | `--radius-*` tokens |
| Shadows | `--shadow-*` tokens |
| Z-index | `--z-*` tokens |

Never use raw hex values, pixel hardcodes, or Tailwind class names.

---

## Component Instantiation Rules

- Preserve all component variants, properties, and constraints from Figma
- Preserve auto-layout and spacing behavior
- Do not modify a component's internal structure when instantiating
- Use `size`, `variant`, `state`, and `type` props exactly as defined in Figma
- Do not add decorative elements not present in the canonical component

---

## Hierarchy Rules

- Only one primary CTA per section
- Navigation must use canonical nav components — do not compose custom nav
- Cards are product components — do not use generic `div` containers for card layouts
- Overlays (Modal, Drawer, Bottom Sheet) must use canonical overlay components

---

## Visual Language

Protocol Labs UI must feel: structured · calm · technical · modular · minimal · trustworthy · infrastructure-like.

Avoid: crypto aesthetics · speculative-finance UI · excessive gradients · glow effects · noisy SaaS dashboards · decorative heavy shadows · over-rounded consumer UI · random accent colors · visual novelty.
