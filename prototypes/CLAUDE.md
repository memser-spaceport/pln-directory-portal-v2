# Prototype styling rules

Rules for any prototype under `prototypes/`. These are hard rules, not suggestions.

## 1. Only edit files inside `prototypes/`
Never modify production code, the root `CLAUDE.md`, or anything outside this folder.
Production is the source of truth — reuse it, never change it.

## 2. Reuse existing components before writing any CSS
Before hand-building UI, check if a component already exists and import it:
- `Badge`, `Button`, `Modal` → `@/components/common/...`
- `Tag` → `@/components/ui/Tag`
- Gantry pieces (`StageBadge`, `IdeaFormFields`, `BoostButton`) → `@/components/page/gantry/...`

A "chip" is just a `Badge`. Reusing the component is always cleaner than restyling a `<div>`.

## 3. portal-v2 does NOT load the `pl-design-system` token layer
The design-system CSS variables (`--foreground-neutral-primary`, etc.) are **not defined**
in this app — `styles/colors.scss` defines almost nothing. So:

- ❌ **Never** write a bare `var(--foreground-neutral-primary)` — it resolves to nothing and the
  color disappears.
- ✅ **Always** write `var(--design-system-name, #fallback-hex)` — the fallback is what actually
  renders today; the token name wires it up for when the app adopts the design system.
- ❌ Never paste raw hex or Tailwind grays (`#0f172a`, `#64748b`, `#d1d5db`). Those are not in the
  PL palette.

Copy the exact `name + fallback` pair from a **neighboring production `.module.scss`** — don't invent it.

## 4. Canonical token pairs (verified in production)

| Use | Write this |
|---|---|
| Primary text | `var(--foreground-neutral-primary, #0a0c11)` |
| Secondary text | `var(--foreground-neutral-secondary, #455468)` |
| Muted / meta text | `var(--foreground-neutral-tertiary, #8897ae)` |
| Brand / link | `var(--foreground-brand-primary, #1b4dff)` |
| Success ("shipped" green) | `var(--foreground-success-primary, #0a9952)` |
| Card border | `var(--border-neutral-subtle, rgba(27, 56, 96, 0.12))` |
| Border on hover | `var(--border-neutral-muted, rgba(27, 56, 96, 0.24))` |
| Subtle shadow / hover bg | `var(--transparent-dark-4, rgba(14, 15, 17, 0.04))` |

## 5. Type sizes must be on the scale
The PL type scale has no `13px` and pairs `14px` with `lh 20/22`. Don't invent off-scale sizes.
