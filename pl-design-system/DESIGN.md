# Protocol Labs Design System — Design Intent

> This document is the authoritative editorial layer of the PL design system. It explains **why** the system is built the way it is — the thinking behind the tokens, the principles that govern component decisions, and the patterns that distinguish Protocol Labs from every other tech-company design system. Treat it as a designer's rationale, not a technical spec. For mechanical reference, read the token files.

---

## 1. Brand Identity

Protocol Labs builds open internet technologies — decentralized infrastructure, the protocols that make networks resilient, collaborative, and not dependent on centralized platforms. The products serve researchers, startups, builders, and communities working on the internet's foundations. The design system is shaped by that purpose, not by branding.

The system feels like infrastructure: dependable, structured, collaborative, extensible. It prioritizes:

- Clarity over decoration
- Systems over marketing flourish
- Modular, scalable structures
- Transparency and accessibility
- Community-first interaction patterns

Three words a PL designer would use to describe the visual style: **structured, calm, technical**. Adjacent qualities the system strives for: modular, functional, open, trustworthy, collaborative.

What the system intentionally does **not** want to feel like:

- Hype-driven crypto or Web3 products
- Trading, speculation, or gambling platforms
- Sci-fi-inspired "blockchain aesthetics" — neon, glow, 3D effects
- Aggressive SaaS marketing sites
- Dark-pattern engagement products
- Enterprise dashboards overloaded with visual noise
- Gamified social media interfaces

This negative space is as important as the positive: the system deliberately rejects visual chaos, speculative-finance aesthetics, trend-chasing UI, loud or decorative gradients, glows, 3D effects, and manipulative engagement patterns. The result is a UI that feels credible and calm — confident enough not to need ornament.

This baseline shapes every component decision. The shadow-only card pattern (no borders, just elevation) is a direct expression of "calm." The cool blue-tinted neutrals are technical without being cold. Brand-blue used for "available" states (instead of green) rejects the traffic-light cliché in favor of treating availability as an act of affiliation. The minimal type scale favors readability and structure over expressive variation.

When in doubt about a design choice, default to the quieter, more structured option. The system's voice is researcher, not marketer.

---

## 2. Token Architecture

The system uses a strict **three-layer architecture** for color tokens, and a **two-layer architecture** for typography. Components consume only from the outermost layer.

### The three layers (color)

**Layer 1 — Primitives** (`--global-color-*`): Raw named values extracted directly from Figma's global style export. `--global-color-blue-500: #1b4dff`. These are reference anchors only. No component or style rule ever references them directly.

**Layer 2 — Semantic** (`--semantic-*`): Role aliases that map function to primitive. `--semantic-brand-500: var(--global-color-blue-500)`. This layer is what makes the system theme-able: if the brand color changes, one edit here propagates everywhere. Do not reference Layer 2 in components — it exists to decouple Layer 1 from Layer 3.

**Layer 3 — Component tokens** (`--background-*`, `--foreground-*`, `--border-*`, `--action-*`): Named by role and context. `--foreground-brand-primary: var(--semantic-brand-500)`. This is the only layer components should consume. Component tokens communicate *intent* — a component reading `var(--border-neutral-subtle)` is semantically explicit in a way that `var(--semantic-neutral-200)` is not.

**Why this layering matters**: brand evolution becomes a one-line change at Layer 2. Token refactors don't cascade into components. An AI agent reading the codebase can understand intent from token names alone.

**Naming convention**: Figma token paths with `/` replaced by `-`. `background/brand/default` → `--background-brand-default`. `foreground/neutral/secondary` → `--foreground-neutral-secondary`.

### Typography layers

Typography uses two layers: `--type-*` custom properties loaded globally (the values), and SCSS mixins via `@include mixins.label-sm` (the conveniences). The separation exists because CSS Modules rejects `:root {}` blocks, so mixin-only partials must be kept separate from the value declarations. Components reference either mixins (for most UI text) or direct `--type-*` tokens (for form inputs — see §4).

---

## 3. Color System

### Brand (blue)

The brand family (`--foreground-brand-primary`, `--background-brand-default`, `--action-bg-brand-normal`, `--border-brand-subtle`) is Protocol Labs blue: `#1b4dff`. Use it for primary interactive elements — the main call-to-action button, focus rings, active navigation states, and affiliation indicators. Do not use it as a general accent; every brand-blue element signals "this is important and actionable."

The transparent brand scale (`--transparent-brand-2` through `--transparent-brand-96`) enables soft background washes without hardcoded rgba values. The "available" state on MemberCard uses `--transparent-brand-6` (not green), which is a deliberate departure from the traffic-light convention. In the PL system, availability and affiliation are brand-blue concepts, not green ones.

### Neutral (slate)

Neutrals are the workhorses — `--foreground-neutral-primary` for body text (`#0a0c11`, slate-900), `--foreground-neutral-secondary` for supporting text (`#455468`, slate-600), `--foreground-neutral-tertiary` for disabled and placeholder states. The neutral scale has a blue-gray tint (built on the `slate` primitive) rather than pure gray, which keeps UI surfaces feeling cool and technical rather than warm.

The border tokens are worth noting specifically because they use transparency, not solid values: `--border-neutral-subtle` is `#1b38601f` (blue-tinted at 12%), which means it reads differently on white versus off-white surfaces. This is intentional — the borders are designed to feel like shadows of the content, not frames around it.

### Error (red)

The error family signals validation failure and destructive action. `--foreground-error-secondary: var(--semantic-error-500)` for error text, `--border-error-default` for error-state borders, `--background-error-soft-surface` for error-state backgrounds. Focus rings on error-state inputs use `--transparent-error-12` to match the visual weight of brand focus rings at `--transparent-brand-8` — maintaining the parallel without making errors look more alarming than they are.

Do not use the `--global-color-red-*` scale directly. Do not use Tailwind's `red-500` — it is a slightly different value and will produce visible mismatch on any surface that also uses PL canonical error tokens.

### Warning (yellow/amber)

Warning tokens (`--foreground-warning-primary`, `--action-bg-warning-normal`) use PL's `yellow-500` (`#f59e0b`). This is **amber-500** in common parlance — explicitly not Tailwind's `amber-500` (`#f59e0b` happens to match here, but `yellow-600` diverges). The "booked" state in MemberCard uses `--transparent-warning-8` for a light amber wash. Keep the scale anchored to `--semantic-warning-*`, not raw hex.

### Success (green)

Success tokens use PL's `green-500` (`#11a75c`). This is not Tailwind's `green-500` (`#22c55e`), which is lighter and more saturated — a known source of drift found and corrected during batch 3 cleanup. Use `--action-bg-success-normal` for success button fills, `--foreground-success-primary` for success text, `--background-success-normal` for the availability dot on MemberCard.

The `--transparent-success-8`, `--transparent-warning-8`, and `--transparent-error-8` tokens do not exist in the canonical Figma export — they were added to the system on demand, following the naming pattern of the canonical brand/dark/light transparent scales. If Figma is ever re-exported, these should be confirmed or formally added.

### Forbidden practices

Never hardcode hex values in components. Tailwind color names (`slate-600`, `green-600`, `amber-500`) are traps — they produce values that are close to but not identical to PL canonical values, and the subtle mismatch accumulates into visible inconsistency across a page. Always go through the token chain: use a `--foreground-*`, `--background-*`, or `--border-*` token. If no token covers your case, request a new one rather than reaching into Layer 1 or 2 directly.

---

## 4. Typography System

All type is [Inter](https://rsms.me/inter/) (v4.1, variable font, SIL OFL 1.1). The typeface is self-hosted — `public/fonts/InterVariable.woff2` and `public/fonts/Inter-VariableFont_opsz_wght.ttf` are bundled in the repo and loaded via `next/font/local` in `src/app/layout.tsx`. In non-Next.js contexts (Storybook, CI) the `@font-face` declaration in `styles/globals.scss` handles the same files. Do not reference Google Fonts CDN — the bundled files are canonical.

The scale is organized into five categories with distinct purposes. Understanding which category to reach for — before choosing a size — prevents the most common typography drift.

### Display (96px)

Hero and marketing surfaces only. `@include mixins.display` (or use `--type-display-*` tokens directly). Never use Display inside application UI — it belongs on landing pages, splash screens, and editorial contexts. There are no `display` uses inside the component library itself.

### Heading (64px → 24px: 3xl, 2xl, lg, md, sm)

Page titles, section headers, dialog titles. Headings have weight 500 (default) or 600 (strong). Use `@include mixins.heading-sm` for dialog and drawer titles, `heading-md` for page-level section titles, `heading-lg` and above for hero sections within application pages. Line heights are looser than the label scale — headings breathe.

### Body (20px → 12px: xl, lg, md, sm, xs)

Prose: paragraphs, descriptions, help text, tooltips, multi-line content wherever the reader's eye needs to scan across several lines. The body scale has weight 400 (default) — it is never medium. Body text uses looser line heights than labels: `body-sm` (14px) has a 22px line height vs. `label-sm` (14px) at 20px. This gap is intentional — body text is designed for reading, labels for glancing.

**Critical distinction**: `body-md` and `label-md` are both 16px. They are not interchangeable. `body-md` is for prose in a 16px context (e.g. a description paragraph in a modal). `label-md` is for UI element labels at 16px (e.g. a primary CTA button, a card title). The difference is intent and weight: `body-md` resolves to w400 (default/reading weight); `label-md` resolves to w500 (the strong variant, appropriate for UI chrome). Same size, same line-height, different role and weight.

### Label (24px → 10px: 2xl, xl, lg, md, sm, xs, 2xs)

All UI controls: button text, form labels, badge text, table cell content, navigation items, card titles, chips, metadata. Labels default to weight 500 (`strong` variant in Figma naming). When hierarchy within a group of labels is needed — e.g. a member name and their role beneath it, both at 14px — differentiate by weight (600 for name, 400 for role), not by size. **Hierarchy via weight, not size** is the system's primary tool for closely-grouped UI text.

### Underline (24px → 12px)

For inline links within body copy. The mixin includes `text-decoration: underline` automatically. Use `underline-sm` or `underline-xs` for links inside `body-sm` or `body-xs` contexts respectively. Never apply manual `text-decoration: underline` to a body or label style — use the underline mixin or token variant instead.

---

### Established implementation principles

**Role governs font-size rounding.** When a value in Figma (or existing code) falls between scale steps, the element's semantic role determines which step to use — not pixel proximity. A CTA card title at 15px rounds to 16px (`label-md`) because it is a primary action anchor. A metadata chip at 13px rounds to 12px (`label-xs`) because it is secondary information. The gap is 1px in both cases; the roles are different.

**Form inputs use direct tokens, not mixins.** `<input>`, `<textarea>`, and `<select>` elements consume font values via `--type-*` custom properties directly (`font-size: var(--type-label-sm-strong-font-size)`), never via `@include`. Mixins set `letter-spacing`, `font-family`, and other properties that interfere with native input rendering and can produce unexpected visual artifacts. This rule applies to Input, Checkbox labels, Switch labels, and any future form controls.

**Mixin override budget.** One mixin property override: use the mixin and override. Two or more overrides: drop the mixin, enumerate tokens explicitly. The budget keeps component SCSS readable — a deeply-customized mixin is harder to reason about than explicit token declarations.

---

## 5. Spacing & Layout

The spacing scale uses t-shirt sizing from `--spacing-5xs` (2px) through `--spacing-7xl` (80px). Values are in `rem` (base 16px), matching the Figma pixel spec.

| Token | rem | px |
|---|---|---|
| `--spacing-5xs` | 0.125rem | 2px |
| `--spacing-4xs` | 0.25rem | 4px |
| `--spacing-3xs` | 0.375rem | 6px |
| `--spacing-2xs` | 0.5rem | 8px |
| `--spacing-xs` | 0.625rem | 10px |
| `--spacing-sm` | 0.75rem | 12px |
| `--spacing-md` | 1rem | 16px |
| `--spacing-lg` | 1.25rem | 20px |
| `--spacing-xl` | 1.5rem | 24px |
| `--spacing-2xl` | 2rem | 32px |
| `--spacing-3xl` | 2.5rem | 40px |
| `--spacing-4xl` | 3rem | 48px |
| `--spacing-6xl` | 4.5rem | 72px |
| `--spacing-7xl` | 5rem | 80px |

The scale has intentional gaps. There is no `--spacing-5xl` (would be 56px or 64px) because the Figma scale jumps to `6xl` (72px) and `7xl` (80px). These gaps are not omissions — they reflect Figma's canonical density breakpoints. Do not fill the gaps with off-scale values; if a layout genuinely needs 64px, use `--spacing-4xl` (48px) or `--spacing-6xl` (72px) and choose based on context.

**Border radius** follows a similar t-shirt scale from `--radius-xsm` (4px) to `--radius-full` (9999px). Interactive controls use `--radius-md` (8px). Cards use `--radius-xl` (12px). Pill shapes use `--radius-full`. The `9999px` pill value is always `var(--radius-full)` — never a hardcoded `border-radius: 9999px` in component code.

**Shadows** encode elevation, not decoration. `--shadow-xs` is the resting surface treatment for cards. `--shadow-sm` is the hover state. `--shadow-xl` is for modals and overlays. Hardcoded `box-shadow` values are not permitted — if an elevation need exists that no token covers, mark it as a TODO and open a token request.

Breakpoints: mobile (375px), tablet (768px), tablet-landscape (1024px), desktop (1280px), desktop-wide (1440px). Import via `@use '../../styles/media'` and use the named mixins (`media.tablet`, `media.desktop`), not raw `@media` queries.

---

## 6. Static Assets

Three categories of static asset are bundled in the repo under `assets/` and `public/`:

### Font

| File | Location | Purpose |
|---|---|---|
| `InterVariable.woff2` | `public/fonts/` | Web-optimized variable font (woff2, fastest to load) |
| `Inter-VariableFont_opsz_wght.ttf` | `public/fonts/` | Full variable TTF for Storybook / CI / fallback |

Both files are Inter 4.1 (wght 100–900, opsz 14–32). Loaded via `next/font/local` in production; `@font-face` in `styles/globals.scss` covers non-Next contexts. Source: [rsms/inter v4.1](https://github.com/rsms/inter/releases/tag/v4.1), SIL OFL 1.1.

### Icons

Icons are from **[Phosphor Icons](https://phosphoricons.com/)** — a MIT-licensed React icon library with a consistent visual language.

**In React components**, import directly:

```tsx
import { PhMagnifyingGlass, PhBell, PhMapPin } from '@phosphor-icons/react';

// Regular weight (default), 16px
<PhBell size={16} />

// Weight can be: regular | bold | fill | duotone | light | thin
<PhBell size={16} weight="fill" />
```

**Standalone SVG subset** — `assets/icons/` contains 32 pre-exported SVG files (regular weight, 256×256 viewBox, `currentColor`) for environments where the npm package isn't available (static HTML, email templates, documentation):

| Icon file | Usage context |
|---|---|
| `magnifying-glass.svg` | SearchInput, NavBar search |
| `bell.svg` | NavBar notifications |
| `x.svg` | Close buttons (Drawer, Sidebar, SearchInput) |
| `list.svg` | Mobile hamburger menu |
| `map-pin.svg` | MemberCard location |
| `calendar-blank.svg` | OfficeHoursCard, schedule buttons |
| `arrow-right.svg` | CTACard, FocusAreaCard stat rows |
| `arrow-square-out.svg` | TeamCard external link |
| `globe.svg` | TeamCard website link |
| `push-pin.svg` | ForumPostCard pinned indicator |
| `caret-down.svg` | Dropdown trigger, nav item chevrons |
| `check-circle.svg` | Alert success state |
| `x-circle.svg` | Alert error state |
| `warning.svg` | Alert warning state |
| `info.svg` | Alert info state |
| `user.svg` | Avatar fallback, profile |
| `users.svg` | Member group count |
| `dots-three.svg` | Overflow / more menus |
| `funnel.svg` | Filter controls |
| `sort-ascending.svg` | List sort controls |
| *(12 more — see `assets/icons/`)* | |

Generated by `scripts/extract-icons.mjs` from the installed `@phosphor-icons/react` package.

### Logos

PL brand assets live in `assets/logos/`:

| File | ViewBox | Usage |
|---|---|---|
| `pl-mark.svg` | 48×48 | Icon-only contexts (favicon, app icon, small avatar) |
| `pl-wordmark.svg` | 172×40 | Full lockup (marketing pages, login screens, dark headers) |

Both SVGs use `currentColor` and a transparent background — they inherit text color from the parent element. The current files are **structural placeholders** — path data must be replaced with the official brand assets from Figma (Design System Foundations → Brand → Logos) before production use.

**Usage in NavBar:**

```tsx
import plMark from '@/assets/logos/pl-mark.svg';

<NavBar logo={<img src={plMark.src} alt="Protocol Labs" width={48} height={48} />} />
```

---

## 7. Component Principles

This section explains how to *think* about adding to or extending the system. The mechanics are in the token files. The judgment calls live here.

### Composition over reinvention

When a new UI need arises, reach for existing primitives first. A new status pill is a Badge with custom color props. A new informational card is a layout using existing spacing tokens, shadow tokens, and typography mixins — not a hand-rolled component with its own spacing and color values. The cost of reinvention is not just the time to build it; it's the maintenance burden of a component that doesn't evolve with the system. A Badge that uses `--transparent-dark-6` will automatically benefit from any future theme change. A hand-rolled status pill using `rgba(14, 15, 17, 0.06)` will not.

### Card surface language

All cards in this system use **elevation** (shadow) rather than **enclosure** (border). At rest: `box-shadow: var(--shadow-xs)`. On hover: `box-shadow: var(--shadow-sm)`. No card in the system has a border by default. This is a deliberate aesthetic choice: bordered cards feel boxed in, constrained. Shadow-only cards feel like objects floating on a surface — lighter, more open, more appropriate for an app that presents dense lists of people, teams, and projects.

This principle was applied and corrected consistently across CTACard, FocusAreaCard, ForumPostCard, MemberCard, OfficeHoursCard, and TeamCard during the Batch 4 token compliance pass. If you are adding a new card-type component, it should not have a default border. If a designer adds a border to a card in Figma, treat it as a question, not a specification — ask whether it should become an elevation variant, not a new pattern.

### Hierarchy via weight, not size

For groups of closely-related text — a card title and subtitle, an author name and bio line, a member name and role — the system uses weight differentiation rather than size differentiation. A member name at `label-sm` (14px/w400) with a semibold override reads as more prominent than the role beneath it at `label-sm` (14px/w400). This creates density without visual noise, which matters when 20 cards are in a grid. If you find yourself reaching for a size jump to establish hierarchy within a compact component, stop and reach for weight first.

### Container-constrained micro-elements

Some elements live inside containers so small that the normal scale doesn't apply. A notification badge rendered inside a 16×16 dot uses `--type-label-2xs-strong-font-size` (10px) because anything larger overflows. Avatar initials in a 20px stacked avatar group use 8px for the same reason. These are **legitimate exceptions** — they exist because the container forces them, and they are documented with comments in the code explaining the constraint.

Aesthetic preference is not a legitimate exception. "I just think 15px looks nicer here" is drift, not constraint. Legitimate exceptions always have a measurable container dimension that prevents the canonical scale value from fitting.

### Off-scale value taxonomy

When a value in existing code doesn't match any token, classify it before deciding what to do:

**Drift** — the value exists because it was hardcoded without attention to the scale, and a correct token exists for it. Round to the nearest token step and apply the token. Most hardcoded values are drift. When a fallback value inside `var(--token, fallback)` doesn't match the token it's paired with, the fallback usually reveals the original intent — treat the mismatch as evidence of a typo in the token name, not a deviation in the value.

**Structural** — the value is a consequence of a specific alignment requirement that a token cannot express. `margin-top: -1px` to handle overlapping borders, `padding: 2px` in a badge where every other axis uses `--spacing-xs`, `border: 1.5px` for a halo ring that must not visually merge with the element it surrounds. These stay, with a comment explaining why.

**Container-constrained** — as above: the value is forced by its container's dimensions. Keep with comment. Do not round to scale.

Drift gets fixed. The other two stay. If you are unsure which category a value belongs to, look for a comment, check Figma, and ask. Defaulting to "keep it" when drift is likely perpetuates the problem.

### Figma is the source of truth

Even when existing code renders otherwise. The token compliance work across batches 1–4 consistently found cases where the code had diverged from the Figma specification — wrong avatar sizes, wrong colors (Tailwind contamination), wrong border/shadow combinations, wrong typography weights. In every case, the canonical answer came from Figma, not from "what the code currently does."

When Figma and code disagree on a value by more than 1–2px (or any amount for color), treat the code as suspect. Verify against Figma, correct the code, and document the correction in a comment. The only exceptions are layout dimensions that represent an intentional structural choice not captured in Figma (see DESIGNER_REVIEW.md for current open items).

### Gradients: compositional, not decorative

The system allows subtle **compositional** gradients where they serve as quiet hierarchical devices — for example, a soft white-to-neutral-subtle gradient behind an avatar in a card header, providing visual lift without ornament.

The system rejects **loud or decorative** gradients — saturated, multi-color, attention-grabbing — which signal marketing intent or speculative-finance aesthetic.

Test for which is which: a compositional gradient is barely noticed; a decorative gradient is the first thing you see. If a gradient calls attention to itself, it's the wrong kind for this system.

**Implementation:** compositional gradients use `--transparent-dark-*` tokens (slate/neutral overlay) rather than `--transparent-brand-*` tokens. Reason: at the low opacity needed for a compositional whisper (4–8%), neutral/slate tints read perceptibly while brand-colour tints appear nearly invisible due to lower contrast against white. The Figma canonical pattern uses a slate wash for card header hierarchy — not a brand-blue wash. No hardcoded hex in gradient stops.

Canonical form for card header hierarchy:

```
linear-gradient(180deg, var(--transparent-dark-8) 0%, var(--background-base-white) 100%)
```

`--transparent-dark-8` is near-black slate at 8% opacity — a cool-grey lift that reads without drawing attention. If that reads as too strong, step down to `--transparent-dark-6`. Both forms are invisible enough that users notice the card's elevation before they notice the gradient. That is the test.

---

## 8. Component Inventory

### Form primitives

**Button** — Primary interactive control. Variants: primary, secondary, ghost, danger, success, warning, and light variants of each. Sizes: sm, md, lg. Use Button for any action that triggers navigation, mutation, or dialog. Do not use a `<div onClick>` or `<a>` styled as a button when the semantic element is `<button>`. Use ghost or secondary variants for low-emphasis actions inside dense UI (table rows, card actions) rather than building a custom lower-emphasis control.

**Input** — Single-line text field. Supports label, hint text, error state, icon slots (leading/trailing), and three size variants (sm, md, lg). Error state uses `--border-error-default`, error text uses `--foreground-error-secondary`, and the error focus ring uses `--transparent-error-12`. Input typography uses direct `--type-*` tokens, not mixins. Do not use Input for multi-line content — that is Textarea.

**Checkbox** — Boolean form control using Radix UI's accessible primitive. Sizes: sm, md. Includes label and description slots. Description uses `label-xs` at w400, accepting the mixin's 16px line height (a deliberate system concession). Do not build a custom checkbox using a styled `<div>` — always use this component for accessibility compliance.

**Switch** — Toggle control for on/off settings. Uses Radix UI's switch primitive. Includes label and description slots. The unchecked track uses `--semantic-neutral-300` directly (a Layer 2 reference) because no Layer 3 component token currently covers "unchecked switch track." This is a documented concession. Do not use Switch for selections that are not binary — use Checkbox groups or a Select. Do not use Switch for actions — it is for persistent settings only. A Switch labeled "Enable notifications" is correct; one labeled "Save changes" is not.

**Badge** — Inline status and category label. Sizes: sm, md, lg. Color variants: default, brand, success, warning, error, and their fill and outline variants. All badge typography uses `label-xs` (sm/md) or `label-sm` (lg) at `font-weight: var(--font-weight-semibold)`. The semibold weight is not optional — badges need it for visual weight at small sizes. Tags inside TeamCard use the filled transparent treatment (`--transparent-dark-6` bg, no border). Do not build a custom status chip when Badge covers the need — a hand-rolled pill will diverge immediately and won't inherit future token changes.

**Textarea** — Multi-line text input. Shares most behavioral patterns with Input. Use for free-form text entry where the expected content length exceeds one line. Do not use Textarea when a single line of input is expected — that is Input.

**Select** — SCSS not yet implemented. The TSX uses Radix UI's Select primitive. Follow Input's token conventions for all field states when adding styles. Do not use Dropdown as a substitute for Select in a form context — Dropdown is for action menus, not value selection.

### Navigation

**Sidebar** — Application navigation rail. Width: 280px (layout dimension, not tokenized). Supports collapsible sections, active state tracking, notification badges, and a contextual header with avatar and branding. The section title uses `font-size: var(--type-label-xs-strong-font-size)` with `text-transform: uppercase` and `letter-spacing: 0.06em` — the uppercase tracking overrides the mixin's default and is required for legibility on all-caps labels. Do not use NavBar and Sidebar simultaneously without a considered layout design; their combination defines the shell of the application. Do not render Sidebar on mobile viewports alongside BottomNav — each viewport should use one navigation surface.

**NavBar** — Top application header. Contains logo mark, logo text (`--type-label-md-strong-*` tokens with `-0.3px` tracking for brand wordmark tightness), and avatar. The notification badge inside the 16×16 indicator dot is a container-constrained micro-element — kept at an off-scale font size with a comment. Do not use NavBar and Sidebar simultaneously without a considered layout design; their combination defines the shell of the application.

**Tabs** — Horizontal tab navigation. Variants: default, pill, bordered. Sizes: sm, md, lg. Badge slots inside tab items use the same semibold badge pattern as the Sidebar. Use Tabs for content switching within a page or section, not for global navigation — that is NavBar and Sidebar's job.

**Drawer** — Side panel overlay. Sizes: sm (360px), md (480px), lg (640px) — layout dimensions, not tokenized. Uses Radix Dialog. The overlay scrim uses `--transparent-dark-50`. Use Drawer for contextual detail panels, secondary forms, or filter interfaces that shouldn't navigate away from the current page. Do not use Drawer for content that warrants a full page — if the user is moving to a meaningfully different section, that is navigation, not a side panel.

**BottomNav** — Mobile bottom navigation bar. Fixed to the viewport bottom. Use only on mobile viewports — pair with `@include media.tablet` to hide it at tablet and above, showing Sidebar or NavBar instead. Do not render BottomNav simultaneously with Sidebar; mobile uses BottomNav, tablet and above uses Sidebar.

**Pagination** — Page navigation for lists. Supports first/last/prev/next and numbered pages. Use Pagination for server-rendered lists where all results can't be loaded. Do not use Pagination with infinite-scroll patterns. The two are mutually exclusive — if results load as the user scrolls, Pagination is dead UI; if Pagination is shown, infinite scroll is creating false expectations of total count.

### Feedback

**Alert** — Inline status message. Variants: info, success, warning, error. Supports title, body, and dismissable behavior. Use Alert for page-level feedback (form submission success, error after an API call). Do not use Alert for ephemeral toast notifications — those are a separate pattern not yet implemented.

**Tooltip** — Contextual label on hover/focus. Themes: light, blue, dark. Sizes: sm, md, lg. Built on Radix Tooltip. The tooltip title uses `font-size: var(--type-label-xs-strong-font-size)` with semibold weight; the body uses `label-xs` at regular weight. Use Tooltip for labeling icon buttons and surfacing secondary context. Do not use Tooltip for critical information — content hidden behind hover is inaccessible to touch users.

**Progress** — Visual progress indicator for long-running tasks. Uses Radix Progress. Use for upload, import, or generation flows where the user should stay on the page. Do not use Progress for indeterminate loading states where no percentage is available — use a loading spinner or skeleton instead.

**EmptyState** — Zero-data placeholder. Contains an icon container (64×64, `--radius-2xl`), a heading (`label-lg` + semibold), a description (`body-sm`), and an optional CTA button. The icon container is a decorative wrapping element — use a simple, on-brand illustration or icon, not a complex graphic. Padding is `--spacing-4xl` (48px) on all sides. Do not use EmptyState as a generic error state — it is for zero-data scenarios. Error states (API failures, permission issues) need distinct treatment.

### Display

**CTACard / CTACardGroup** — Promotional action card. The title uses `label-md` + semibold — card titles are primary action labels, not body text. The description uses `label-xs` at w400. CTA cards are composable into groups with a divider between them. Use for dashboard-level prompts and featured actions. Do not use CTACard for primary navigation paths through the app — CTAs surface promoted or optional actions, not the main flow.

**FocusAreaCard** — Domain focus area with a stacked avatar group and stat rows. The stacked avatar group uses overlapping 20px avatars with a 2px white separation border. The title is `label-lg` (18px) per Figma, not `label-md`. Use for directory-style domain listing. Do not use FocusAreaCard for a single entity in isolation — it is built for grids and discovery feeds where its visual rhythm against neighbors is part of the experience.

**ForumPostCard** — Discussion post preview. Title is `label-lg` (18px), excerpt is `body-sm` for prose line-height, author metadata is `body-xs`. Cards have `--shadow-xs` at rest and `--shadow-sm` on hover; border uses the lighter `--border-neutral-xsubtle` (6%), not `--border-neutral-subtle` (12%). The `authorAvatar` uses the canonical 24px `Avatar size="sm"` primitive — corrected from the pre-Phase-2.2 inline 28px. Do not use ForumPostCard as a detail view — it is a preview component. Clicking it should navigate to the full post.

**MemberCard** — Compact member preview for dense contexts: search results, autocomplete dropdowns, member lists in sidebars, recent-members widgets, condensed grid views where many cards must fit. Avatar: 80px (Figma canonical). Available state uses brand-blue (`--transparent-brand-6` bg, `--border-brand-subtle`, `--foreground-brand-primary`) — explicitly not green. Booked state uses `--transparent-warning-8`. The card has no border at rest — shadow only. Flat surface, simple composition, optimised for vertical density. Do NOT use for primary member discovery pages — use MemberProfileCard instead.

**MemberProfileCard** — Hero member preview for directory pages, discovery surfaces, and other contexts where member identity is the primary visual focus. Includes a subtle compositional gradient card header (per §7), decorative concentric SVG ring overlays centred behind the avatar, a 96px (`size="3xl"`) `Avatar` primitive centred on the banner/content boundary, and an inline availability pill at the avatar base. The gradient uses a compositional slate wash per §7 (`--transparent-dark-8` → `base-white` — barely perceptible cool-grey lift; dial back to `--transparent-dark-6` if it reads as loud). Rings use `--transparent-brand-6`/`8` — structural, not decorative. The card has no border at rest — shadow only. Do NOT use for dense list views or sidebars — use MemberCard instead.

**OfficeHoursCard** — Scheduled session card with host information. Avatar: 56px. Card border-radius is `--radius-md` (8px), tighter than most cards. The host name and role share the same font size (`label-md`) but are differentiated by weight — semibold vs. regular. Use for scheduling and directory contexts. Do not use OfficeHoursCard as the only source of truth for a session — it is a preview; a full session detail or scheduling flow should exist.

**TeamCard** — Organization/team profile card. Landscape composition: logo (52px, `--radius-xl`) + name/tags in header row, description, member rows below. The logo size is 52px in the landscape implementation (Figma's portrait spec shows 80px) — flagged for designer review in DESIGNER_REVIEW.md. Tags use the filled transparent treatment, not an outline border. Do not treat TeamCard as authoritative — it is a directory preview. The full team profile page is the canonical source.

**Table** — Data table with sortable columns, row variants, and pagination integration. Use Table for structured data comparison. Do not use Table for homogeneous card-style data where a grid of cards communicates the content more naturally.

**PageHeader** — Consistent page title and breadcrumb section. Use at the top of all content pages that aren't dashboards or landing pages. Do not use PageHeader on dashboard-style landing pages or empty states — it is for content pages with a meaningful title hierarchy.

### Interactive

**Dropdown** — Menu of actions or navigation choices triggered by a button. Built on Radix DropdownMenu. Use for action overflow menus ("…" buttons), user menus, and grouped action sets. Do not use Dropdown for single-value form selection — that is Select.

**ContextMenu** — Right-click contextual action menu. Built on Radix ContextMenu. Use sparingly — context menus are a power-user affordance and are invisible to most touch users.

**Slider** — Range input. Use for numeric value selection where a range is more natural than a text field (volume, threshold, percentage). Do not use Slider for precise numeric input where exact values matter — use a number Input instead, optionally paired with a Slider for visual context.

**Accordion** — Collapsible content sections. Built on Radix Accordion. Supports single and multiple open states. Use for FAQ patterns and collapsible detail panels. Do not use Accordion as navigation — use Sidebar sections instead.

### Specialized

**SearchInput** — Search field with leading icon and clear button. Extends Input with search-specific behavior. Use whenever the primary field purpose is filtering or querying. Do not use SearchInput for general text entry — it carries the visual and semantic expectation of filtering or querying.

**Steps** — Linear progress indicator for multi-step flows. Shows completed, active, and pending states. Use for multi-step forms, onboarding, and checkout-style flows. Do not use Steps to represent parallel options or choices — Steps implies a required linear sequence.

**Upload** — File drop zone with progress feedback. Use for file attachment and import flows. Do not use Upload for image selection within a form where a preview is the primary goal — consider a dedicated image input with inline preview instead.

**Carousel** — Horizontally scrollable item sequence. Use for featured content, media galleries, and limited-width browsing contexts. Do not use Carousel as the primary navigation pattern for data — users miss items.

**Lightbox** — Full-screen image viewer with navigation. Use for image galleries and document previews where the content warrants full-screen attention. Do not use Lightbox as a navigation pattern for non-image content — if the content isn't a media asset that benefits from full-screen viewing, it belongs on a page.

### TODO (stubs — empty directories)

**Avatar** — `components/Avatar/` contains the canonical Avatar primitive (Phase 2.1, May 2026). Two shapes: `circle` and `rounded` (4px). Seven sizes: `xs`=20px through `3xl`=96px, matching Figma's Tiny–Big scale. Six content types: `image`, `placeholder`, `letter-of-name`, `brand-logo`, `emoji`, `flag`. Also exports `AvatarStack` for grouped/overlapping avatar rows.

**Size-aware initials:** The `letter-of-name` fallback uses a single initial at `xs`/`sm`/`md` (20–32px containers) and two initials at `lg`/`xl`/`2xl`/`3xl` (40px+). This matches Figma canonical (node 10:1763, all 14 size×shape variants) and accommodates visual density at smaller sizes. Single-word names always use a single initial regardless of size.

**Container-constrained font sizes at xs/sm:** Initials at `xs` and `sm` use 11px (Figma canonical), which sits between the standard type-scale steps of `label-2xs` (10px) and `label-xs` (12px). The 20px/24px containers cannot accommodate 12px semibold initials without visual crowding. This is a structural exception per the Container-Constrained category in this document — not drift to be normalized.

**Card** — `components/Card/` is empty. No generic card primitive was found in the Figma files; the system currently uses named card components (MemberCard, TeamCard, etc.) directly. This directory may be a speculative placeholder. Verify with design before building.

**DatePicker** — `components/DatePicker/` is empty. Status not verified in this audit because the relevant Figma file was not accessible during review. Before implementing: confirm with design whether DatePicker exists as a defined component, or whether date selection is handled differently (e.g. inline within Input).

**Icon** — `components/Icon/` is empty. The Design System Icons Figma file is the canonical icon library and contains the full icon set. Implementation should wrap icon assets with a consistent size-and-color prop interface.

**Toggle** — `components/Toggle/` is empty. Status not verified in this audit. Toggle may overlap with Switch in Figma's component library, or it may be a distinct segmented-control pattern. Before implementing: confirm with design which is intended.

**Select** — `components/Select/` has a TSX file using the Radix Select primitive but no SCSS. Follow Input's token conventions for all field states when adding styles.

---

## 9. Anti-Patterns

**Don't use Tailwind color names.** Tailwind's `slate-600`, `green-500`, `amber-500` are close to PL canonical values but not identical. They contaminate component styles with values that will quietly mismatch PL token values. In every case where Tailwind-sourced values were found during compliance review (Batches 3 and 4), the code was wrong — not intentionally different.

**Don't reach into the primitive layer from a component.** If `--foreground-brand-primary` doesn't cover your case, add a new Layer 3 token, not a `var(--global-color-blue-500)` reference in your component. Bypassing the token chain breaks theme-ability and makes intent opaque.

**Don't reinvent badges, cards, or buttons inline.** A status chip hand-rolled with `background: rgba(17, 167, 92, 0.08); border-radius: 9999px; font-size: 12px` inside a card's SCSS is a maintenance liability. It will diverge from Badge immediately. Compose Badge.

**Don't add borders to cards.** Cards in this system use elevation only. A border on a card is a design question, not a default.

**Don't use decorative gradients.** Multi-color, saturated, or attention-grabbing gradients are a design anti-pattern. They signal marketing intent, not functional hierarchy. Compositional gradients — subtle slate-to-white transitions using `--transparent-dark-*` tokens used to define a card header zone — are permitted provided they follow the rule in §7 (Gradients: compositional, not decorative). Do not use `--transparent-brand-*` tokens for gradients; at compositional opacity levels (4–8%) they are effectively invisible on white. The practical test: a compositional gradient is not the first thing a user would describe about the component it lives in. If it is, it has crossed from compositional to decorative.

**Don't use hardcoded `box-shadow` values.** Use shadow tokens (`--shadow-xs`, `--shadow-sm`, `--shadow-xl`, `--shadow-button`, `--shadow-dropdown`). If your need isn't covered, add a token. Mark any existing hardcoded shadows as TODO.

**Don't use `border-radius: 9999px`.** Always `var(--radius-full)`.

**Don't write fallback values in `var()` calls.** `var(--token, hardcoded-fallback)` is a smell in two directions: either the fallback contradicts the token (a typo in the token name, revealed by the mismatch) or it signals distrust in the token system (the token exists and resolves correctly — the fallback is defensive noise). Fix the token name or remove the fallback. Fallback values in this codebase have proven to reveal typographic intent more reliably than the token names they were paired with — which is exactly why they should not be left in the code.

**Don't combine Sidebar + BottomNav + NavBar simultaneously in the same viewport.** These define the application shell. Mobile uses BottomNav. Tablet and above uses Sidebar or NavBar. Rendering more than one simultaneously creates competing navigation surfaces, confuses hierarchy, and wastes screen space. Each viewport class gets one navigation pattern, full stop.

**Don't use Drawer or Lightbox to fake navigation.** These are contextual overlays — they supplement the current context, they do not replace it. If the user is moving to a meaningfully different section of the application (new entity, new workflow, new domain), that is a route change, not an overlay. Overuse of Drawer for what should be pages accumulates into a UX that hides structure behind layers.

---

## 10. Open Questions for Design

See [DESIGNER_REVIEW.md](./DESIGNER_REVIEW.md) for the current open items flagged during Batch 4 token compliance work. At time of writing, there is one open item: the TeamCard layout orientation divergence (code landscape vs. Figma portrait — see DESIGNER_REVIEW.md §2). This should be resolved before TeamCard is used in production.

---

*Last updated: May 2026*

**Canonical Figma files:**
- [Design System Foundations](https://www.figma.com/design/ajJidFJgQCsS9nzXbq6upe/Design-System-Foundations-%7C-Protocol-Labs) — colors, typography, spacing primitives
- [Design System Icons](https://www.figma.com/design/apsV3GKbIbOSpZYGvhdKqU/Design-System-Icons-%7C-Protocol-Labsd) — icons, emojis, avatars
- [Design System Default Components](https://www.figma.com/design/V7AhdMa4HXackrEpe8036f/Design-System-Default-Components-%7C-Protocol-Labsd) — base UI components
- [Design System Design Components](https://www.figma.com/design/su9oMYFBgLwUcfKESSLis0/Design-System-Design-Components-%7C-Protocol-Labsd) — composed/page-level components
