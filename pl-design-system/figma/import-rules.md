# Figma Import Rules

These rules apply to all AI agents generating UI for PL Network / LabOS.

---

## Rule 1 — Search library first

Before building any UI element, search the Figma library for the canonical component matching the required element. Use the Figma source map at `/figma/figma-source-map.md`.

## Rule 2 — Prefer instances over recreation

Always use a component instance from the library. Never redraw, recompose, or approximate a component that exists in Figma.

## Rule 3 — Preserve component integrity

When instantiating a component:
- Preserve all variants and properties as defined in Figma
- Preserve auto-layout and spacing behavior
- Preserve constraints
- Do not add or remove layers inside an instance

## Rule 4 — Do not detach

Do not detach component instances from the Figma library unless:
- Explicitly instructed by the user
- A specific, documented override is required

## Rule 5 — Do not flatten icons

Icons are Phosphor icon components from the library. Do not flatten, redraw, or substitute with custom SVG paths.

## Rule 6 — Do not recreate components that exist in Figma

If a component exists in the Figma library, it must be instantiated — never recreated. This applies to:

buttons · inputs · textareas · checkboxes · badges · dropdowns · tabs · cards · modals · drawers · sidebars · tables · pagination · progress bars · sliders · toggles · alerts · notifications · empty states · upload components · navigation components · product cards · layout patterns

## Rule 7 — Do not use page examples as source components

Page examples (Home, Forum, Members, etc.) are structural references only. They show layout and hierarchy — not component definitions. Do not extract component specifications from page screenshots.

## Rule 8 — Dev Mode for inspection only

Use Figma Dev Mode exclusively to inspect token/style/component metadata. Do not copy raw CSS values from Dev Mode — use the token system instead.

## Rule 9 — Missing component protocol

If the required component cannot be found in the Figma library:

```
Missing canonical component: [component name]
```

Stop. Do not invent a replacement. Do not approximate.

## Rule 10 — No invented components

If a required component does not exist in the Figma library, it must not be created. Ask the user for confirmation and direction.
