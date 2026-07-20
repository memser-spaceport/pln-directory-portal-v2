# Trust & Holdings — Design Spec

Source of truth: Figma frame **"Frame 2147263853"** (`13835:4401`), file **PL - A Des - 20260707**, page **PLAA**.
Data comes from the backend `GET /api/v1/trust-holdings` (see `plaa-service`); this page renders it.
Rule: **Figma owns layout + copy; the backend owns the numbers.**

## Color tokens
| Token | Hex | Role |
|---|---|---|
| ink | `#0f172a` | Headings, hero value, emphasised cells |
| body | `#475569` | Body text |
| muted | `#94a3b8` | Captions, table header, "as of" |
| muted-2 | `#64748b` | Secondary body, legend % |
| line | `#e2e8f0` | Card borders |
| line-soft | `#eef1f5` | Row separators, toggle bg |
| panel | `#f8fafc` | Subtle panel bg |
| primary | `#156ff7` | Links, active nav, buttons, banner |
| primary-tint bg / border | `#eef4ff` / `#d6e4ff` | CTA card |
| active-nav bg | `#dbeafe` | Active sidebar item |
| white | `#ffffff` | Card / page background |

## Typography — **Inter** only
Weights: Regular 400 · Medium 500 · Semi Bold 600 · Bold 700 · Italic 400.

| Element | Size / line-height | Weight | Color |
|---|---|---|---|
| Page H1 | 32 / 45 | 700 | ink |
| Page intro | 16 / 22 | 400 | body |
| Section H2 | 24 / 34 | 700 | ink |
| Section subtitle | 15 / 21 | 400 | body (buyback uses muted-2) |
| Hero label "NAV / PLAA" | 16 / 17 | 700 | primary · letter-spacing 0.6px |
| Hero value | 42 / 59 | 700 | ink |
| Hero caption | 16 / 22 | 500 | muted |
| Eyebrow "Est. AS OF …" | 11 / 15 | 500 | muted · letter-spacing 0.4px |
| Chart title "Trust Total Net Asset Value" | **24** | 600 | ink (measured from Figma; the `**PLVH…` note below it is ~13 / 400 muted on its own line) |
| Chart bar value | 13 | 700 | ink |
| Chart NAV/PLAA point | 12 | 700 | — |
| Quarter axis / active | 12 | 500 / 600 | — |
| Chart footnote | 12.5 / 18 | 400 | muted |
| Toggle (active / idle) | 13 | 600 / 500 | ink / muted-2 |
| Chart key labels | 13 | 500 | body |
| Buyback card label | 12 | 600 | muted-2 · uppercase |
| Buyback card value | 24 | 700 | ink |
| Buyback note | 13 / 18 | 400 | muted-2 |
| Link "View full buyback results →" | 14 / 20 | 600 | primary |
| CTA H | 22 / 31 | 700 | ink |
| CTA subtitle | 15 / 21 | 400 | body |
| CTA button | 15 / 21 | 600 | white |
| Donut center value | 38 (portfolio) / 30 (composition) | 700 | ink |
| Donut center label | 10 | 600 | muted · uppercase |
| Focus-area name / % | 15 / 16 | 600 / 700 | ink / muted-2 |
| Legend description | 12.5 | 400 | muted |
| Legend amount | 15 | 600 | ink |
| Disclaimer body | 14 / 20 | 400 | body |
| "What is PLAA" callout | 15 / 24 | 400 **italic** | body |
| Table header | 11 | 600 | muted · uppercase · letter-spacing 0.04em |
| Table cell | 13.5 | 400 (DATE 500, NAV 700) | ink |

## Layout & spacing (px)
Page column width **1052**; sections stack with **28** gap.

| Container | Radius | Padding (T·R·B·L) | Fill / border |
|---|---|---|---|
| Section card (default) | 16 | 34 · 40 · 34 · 40 | white / line |
| NAV section | 16 | 36 · 40 · 36 · 40 | white / line |
| Hero card | 12 | 16 · 20 · 16 · 20 | white / line |
| Toggle | 9 | 4 all | — / line-soft |
| Buyback card | 12 | 20 all | white / line |
| CTA card | 14 | 26 · 32 · 26 · 40 | `#eef4ff` / `#d6e4ff` |
| CTA button | 8 | 13 · 24 · 13 · 24 | primary |
| Disclaimer list | — | 12 row gap | — |
| Donut ↔ legend gap | — | 56 (portfolio) · 48 (composition) | — |
| Donut | — | 320 × 320 | — |

## Monthly data table (NAV section → "Monthly" toggle)
Panel radius 14, white, border `line`. Header row **43** tall, padding `15 · 24`; data rows **50** tall, padding `17 · 24`, separated by `line-soft` hairlines. 14 rows (Jun '25 → Jul '26). Empty cells render `—` in `#cbd5e1`.

| Column | Width | Align | Cell weight |
|---|---|---|---|
| DATE | 88 | left | 500 |
| TOTAL PLAA | 96 | right | 400 |
| NAV | 100 | right | 700 |
| NAV/PLAA | 80 | right | 500 |
| US TREASURIES | 112 | right | 400 |
| BTC | 96 | right | 400 |
| ETH | 92 | right | 400 |
| FIL | 92 | right | 400 |
| PLVH | 134 | right | 400 |

## Canonical copy (Figma) — items currently drifting in the component
These strings must match Figma; several are stale in `trust-holdings.tsx`:

| Where | Should read |
|---|---|
| Hero label | `NAV / PLAA` (not "PLAA / NAV") |
| Hero caption | `Est. Net Asset Value per PLAA as of July 1st, 2026` |
| Eyebrow | `Est. AS OF JULY 1ST, 2026` |
| Focus-area subtitle | `Share of PLVH exposure by category · 6 categories · as of Jun 30, 2026` |
| Buyback link | `View full buyback results →` |
| Buyback block | Figma is its own section "Buybacks & Past Results" + subtitle "Factual record of the most recent rights buyback" (component currently uses a "BUYBACK INFORMATION" eyebrow inside the NAV card) |

## Section order (matches Figma)
Header → NAV → **Buybacks & Past Results** → CTA → PLVH Portfolio → Trust Composition → Disclaimers → **What is PLAA** callout.

Buyback cards carry per-label accent colors (backend order = price/date/next): green `#16a34a`, blue `#156ff7`, ink `#0f172a`; cards sit in a tinted panel (`#f8fafc`, border `#eef1f5`, radius 16, pad 24) with a note + "View full buyback results →" link.

## Marker shapes (two different swatches — don't conflate)
- **Chart key** (PLVH / Digital assets / US Treasuries): 12×12 **rounded square, radius 4**; NAV/PLAA is a line 18×3 radius 2. Colors: `#30c593`, `#0090ff`, `#64748b`, line `#1e3a8a`.
- **Donut legend** rows (composition / focus areas): 12×12 **circle** (radius 6). Composition colors: PLVH `#30c593`, FIL `#0090ff`, BTC `#0b3d91`, ETH `#66b2ff`, Treasuries `#64748b`.

## Notes
- Focus-area % is **count-share** by product decision (see backend `toFocusAreas`); the Figma label says "exposure".
- Pre-existing lint: two `react/display-name` errors on the inline chart render-prop components (not from this work).
