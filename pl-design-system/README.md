# PL Network / LabOS Design System

AI-readable documentation layer for the Protocol Labs / LabOS Design System.

## What this repository is

This repository is a **documentation and retrieval layer** that tells AI tools (Claude Design, Figma Make, Cursor, etc.) how to find and use canonical components from the Figma Design System library.

**Figma remains the single source of truth.** This repo does not contain the design system — it documents it.

## What this repository is NOT

- Not a component library
- Not a Storybook
- Not a visual approximation of components
- Not a place to recreate or regenerate components
- Styles are not regenerated here

## How AI tools must use this repository

1. **Read `guidelines.md` first** — contains the core rules for generation
2. **Read `/figma/retrieval-priority.md`** — understand what to look for first
3. **Read `/figma/figma-source-map.md`** — find the canonical Figma path for any component
4. **Read the relevant component spec** in `/components/primitives/` or `/components/product/`
5. **Instantiate from Figma** — never recreate manually

## Figma Design Library

Canonical source: [Design-System-Full | Protocol Labs](https://www.figma.com/design/0fFjyzEincRez6m3D80vLg/Design-System-Full-%7C-Protocol-Labs?node-id=802-20272&m=dev)

## Missing component rule

If a required component cannot be found in Figma, output exactly:

```
Missing canonical component: [component name]
```

Then stop. Do not approximate. Do not invent.

## Repository structure

```
/README.md                       ← this file
/guidelines.md                   ← core AI generation rules
/figma/
  figma-source-map.md            ← Figma page/path index for all components
  import-rules.md                ← rules for importing from Figma
  component-contracts.md         ← per-component contracts
  retrieval-priority.md          ← retrieval order for AI agents
/components/
  component-catalog.md           ← full component inventory
  /primitives/                   ← primitive component specs
  /product/                      ← product/composite component specs
/patterns/
  layout-patterns.md
  layout-compositions.md
  overlay-patterns.md
  page-examples.md
/examples/
  home-page.md
  forum-page.md
  members-page.md
  team-page.md
  deals-page.md
  demo-day-page.md
  founder-guides-page.md
  job-board-page.md
```

## Visual language

Protocol Labs / PL Network UI must feel:
- Structured, calm, technical, modular
- Minimal, trustworthy, community-oriented
- Infrastructure-like: readable, scalable, collaborative, functional

Avoid: flashy crypto aesthetics, speculative-finance UI, excessive gradients, glow effects, noisy dashboards, heavy decorative shadows, Dribbble-style novelty.
