# Retrieval Priority

When generating UI for PL Network / LabOS, retrieve components in this exact order:

---

## Priority 1 — Primitive Components

Search here first for any interactive or atomic UI element.

Examples: Button, Input, Checkbox, Badge, Dropdown, Tabs, Accordion, Carousel, Pagination, Progress, Slider, Toggle, Date Picker, Upload, Empty State, Tooltip, Alert, Context Menu, Drawer

**Why first:** Primitives are the atomic building blocks. All product components and layouts are composed from verified primitives. Using the correct primitive ensures token fidelity, accessibility, and visual consistency.

---

## Priority 2 — Product / Composite Components

Search here for domain-specific composed components.

Examples: Cards (Member, Team, Forum, Deals, Demo Day, Jobs, Founder Guides, Office Hours), Header & Nav, Sidebar, Bottom Navigation, Comments, Tables

**Why second:** Product components are pre-composed from primitives in Figma. Using them directly gives you correct spacing, hierarchy, and context-specific variants without reassembling from scratch.

---

## Priority 3 — Layout Patterns

Search here for structural composition patterns.

Examples: Grid, Sidebar + Grid, Sidebar + List, Stack, Centered Content, Full Width, Split Content

**Why third:** Layout patterns define structure only — they do not contain visual components. Use them as containers into which you place instantiated components from Priority 1 and 2.

---

## Priority 4 — Page Examples

Search here only for structural/hierarchy reference.

Examples: Home Page, Forum Page, Members Page, Team Page, Deals Page, Demo Day Page

**Why last:** Page examples are reference compositions. They show how components fit together in a real screen — not component specifications. Do not extract component definitions from page examples. Do not recreate page sections as components.

**Critical rule:** Never use a page screenshot to recreate a component that exists in Priority 1 or 2.

---

## Priority 5 — Foundations / Styles

Use only when composing layout that requires direct token usage.

Examples: Color tokens, Typography tokens, Spacing tokens, Shadow tokens

**Why last:** Foundations are implementation details consumed by components. You should rarely need to reference them directly — if a canonical component exists, it already applies the correct tokens internally.

---

## Summary table

| Priority | Source | Use for |
|---|---|---|
| 1 | Primitive Components | Any atomic UI element |
| 2 | Product Components | Domain-specific composed UI |
| 3 | Layout Patterns | Structure / container patterns |
| 4 | Page Examples | Structural reference only |
| 5 | Foundations | Direct token reference when no component applies |
