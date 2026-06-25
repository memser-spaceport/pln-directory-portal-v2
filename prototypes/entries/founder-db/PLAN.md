# Founder DB — UX improvement plan

> Status: **v0 BUILT** in `prototypes/entries/founder-db` (clone re-synced to the current
> production redesign + Alignment re-introduced). **v1 not yet built.**
> Build target for both: the `prototypes/entries/founder-db` entry, in place.

This plan is split into **v0** (ship-tomorrow minimum) and **v1** (the fuller experience).
**v0 is a strict subset of v1** — building v0 first never gets thrown away.

## Production baseline (current redesign — `feat/LAB-1963/pln-proximity-column`)

The deployed Founder DB was redesigned and **removed Alignment from the table entirely**.
The clone now mirrors that, and v0 deliberately re-introduces Alignment on top.

| Aspect | Current production | What v0 does |
|---|---|---|
| Columns | Founder · Fund · **Sources** · **PLN Proximity %** · Status | re-adds an **Alignment** column (bar) |
| Default sort | **Last signal (newest)** | defaults to **Alignment (high–low)** |
| Sort options | Last signal, Name | adds Alignment (high–low / low–high) |
| Filters | Search · **Raising now** · Fund · **Thesis** · Review status · Source | unchanged |
| Name cell | headline → name → pedigree → **signal badges** (Raising / Near network / Stealth / PL-aligned / Cofounder) | unchanged |
| Drawer | header + signal badges, **"Affinity-stage detail"**, provenance, verification, **"Review notes"**, channel-based **Feedback / Approve / Reject** review | reproduced faithfully |
| Methodology | **"About this data"** → `FounderMethodologyModal` | reproduced (`FounderMethodologyModalMock`) |

**Note the tension:** production de-prioritised Alignment (removed the column, sorts by
recency). v0 argues the opposite — that Alignment should be elevated for the "who to
approve" judgement — so it re-adds the column + sort. Worth validating with the team.

---

## Goal (applies to both versions)

Help a Protocol Labs investor answer one question fast: **"Who are the best-aligned
founders worth approving?"** — make each person's *value* (how strong a fit they are)
visible at a glance, and make approving the right ones easy.

**The terminal action is Approve, not "reach out."** Reviewing a founder (production
`ReviewActionsPanel`) sets a decision — `new / in-review / approved / rejected / hold` —
plus optional feedback + note. **Approving a founder is what adds them to Affinity** (the
CRM); the actual outreach happens later, inside Affinity, not on this page. This page's job
is **triage → approve into Affinity**.

### Two hard constraints (learned during planning — do not violate)
1. **One list, never two.** A separate "top 10" section above a full table **duplicates**
   the top founders (they appear in both). Highlight *inside* the single sorted list.
2. **No warm intros.** The Founder DB has no warm-intro engine — that's an Investor DB
   feature. Founder records never carry that data; don't surface it.

### Scope note: alignment now, PLVS later
- **v0 + v1 rank/highlight by Alignment % only.** PLVS stays a quiet secondary number.
- A **later v2** (separate copy) introduces PLVS as a second axis so "fit" (alignment) and
  "investability" (PLVS) merge into one judgment. v1's structure is built so this grafts on.

---

## Evidence base (ui-ux-pro-max skill database)

| Dimension | Recommendation | Source |
|---|---|---|
| Product pattern | *Analytics / Financial Dashboard* → **Data-Dense**, "Clarity > aesthetics, color-coded data priority" | products.csv #6–7 |
| Core visual for "rank by a score" | **Horizontal Bar Chart** — "ranking is the core insight; sort descending; value labels on each bar" — graded **AAA** | charts.csv #2 |
| "Is this person above the bar?" | **Bullet chart** — score vs target/threshold; "always show the value as text; never rely on color position alone" | charts.csv #8 |
| A11y guardrails | `color-not-only`, `number-tabular`, `sortable-table` + `aria-sort`, `direct-labeling`, `visual-hierarchy` via size/contrast | UX Quick Ref §6, §10 |
| Action discipline | One **primary CTA** per surface; secondary actions subordinate | §4 `primary-action` |

**Takeaway:** ranking by a single score is a solved visual problem — a sorted
horizontal-bar list with value labels and a threshold marker. The current page has the data
but renders Alignment as a plain `72%` text cell, forcing digit-by-digit reading.

## Diagnosis — why the current page doesn't serve "who do I approve?"

1. **Alignment isn't in the table at all.** The redesign removed the column; you can't read
   thesis-fit from the grid — only PLN proximity (reachability) and recency.
2. **Default sort is recency ("Last signal"), not fit.** The list isn't ordered by how
   strong a match each founder is.
3. **Where alignment *does* show (drawer), it's a number, not a magnitude.** Can't rank at a glance.
4. **No notion of "qualified."** No visible threshold where "strong fit" ends.
5. **No fast approve.** Approving — the page's whole purpose — requires opening the drawer.

---
---

# ⚡ v0 — Minimum (make alignment legible)

**Thesis: change how alignment is *read*. Add nothing that needs new state.**
Keep the production clone exactly as-is; layer on two presentational changes.

### What v0 adds
1. **Re-introduce the Alignment column as a bar.** Production removed Alignment from the
   table; v0 adds it back, rendered as a short horizontal bar + tabular % (not bare text).
   Length encodes magnitude so the eye ranks instantly. *(charts.csv #2)*
2. **Default sort = Alignment (high–low).** Production defaults to Last signal; v0 leads
   with alignment so the ranking + cut-line are meaningful on load (both sorts selectable).
3. **One strong-fit cut-line.** A single divider across the sorted list labelled
   **"★ Strong fit ≥ 85%"**, so "where the good ones end" is visible. Just a separator row
   + label — no banding, no row restyling. Hidden on any non-alignment sort.

### v0 mockup (new production columns + the re-added Alignment)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Founder                          Fund      Alignment       Sources   PLN Prox.  Status  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  PLVS · agent runtime · shipped   [PLVS]   ▓▓▓▓▓▓▓▓▓▓ 96%   3 src     82%        Approved │
│    Dr. Mei Lin · MIT CSAIL                                                                │
│    [Near network][PL-aligned][Stealth]                                                    │
│  PLVS · LLM eval · stealth        [PLVS]   ▓▓▓▓▓▓▓▓▓▓ 94%   2 src     74%        In Review│
│    Tomás Herrera · ex-Anthropic                                                           │
│    [Raising][Stealth][Near network]                                                       │
│  …  Aisha 92 · Yuki 89 · Priya 87 · Lucas 85                                              │
│ ┄┄ ★ Strong fit ≥ 85% · 6 above  ·  below: keep reviewing ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │ ← cut-line
│  Crypto · storage indexing        [Crypto] ▓▓▓▓▓▓▓░░ 83%   2 src     62%        Hold     │
│    Hannah Okonkwo · Filecoin grant                                                        │
│   …                                                                                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
*(The name cell stacks headline → name → pedigree → signal badges, matching the new
production design. One cut-line only, at the 85% boundary on the alignment-desc spine.)*

### v0 keeps the new production design intact
KPI strip, filters (Raising / Thesis), PLN Proximity column, signal badges, channel-based
drawer, "About this data" methodology modal, CSV export — all reproduced/untouched. v0 only
**adds back** the Alignment column + bar, the alignment sort, and one divider. Approving
still happens in the drawer. v0 speeds up the **judgment**, not the action.

### v0 — explicitly NOT in scope (deferred to v1)
- ❌ Inline Approve / Reject / Note row actions (that's v1 — needs state, toasts, popover)
- ❌ Promising tier / second cut-line (v0 has **one** line only)
- ❌ Top-tier row emphasis / marginal de-emphasis
- ❌ KPI cards as filters, approved counter, shortlist export, row pinning

### v0 implementation checklist — DONE
- [x] Built in place in `prototypes/entries/founder-db` (pristine clone recoverable via git).
- [x] `AlignmentBar` component + `.module.scss`: bar length = %, tabular label, `aria-label`,
      token+fallback colors. One hue; length is the signal.
- [x] Re-added the Alignment column to the table + the column chooser; visible by default.
- [x] Added Alignment sort options; prototype default sort = `alignmentMax:desc`.
- [x] One cut-line divider at the 85% boundary; hidden on non-alignment sorts.
- [x] `npx tsc --noEmit` clean for all `entries/founder-db` files.

**v0 effort:** one small presentational component + a divider on top of the re-synced clone.

---
---

# 🚀 v1 — Fuller experience (make approving fast)

**Builds directly on v0.** Adds tiers, top-tier emphasis, and the inline review actions.
Everything in v0 stays; v1 layers on top.

### What v1 adds on top of v0
1. **Two tiers instead of one cut-line** — segment the sorted list:
   ```
   ★ Strong fit   ≥ 85%     (emphasized rows)
   ● Promising    70–84%    (normal rows)
      Marginal    < 70%     (de-emphasized; optionally collapsed)
   ```
   Each bar gets a **threshold marker (`│`)** at 85% so every person reads relative to the
   strong-fit line. *(bullet-chart idea, charts.csv #8)*
2. **Top-tier emphasis / marginal de-emphasis** — strong-fit rows get heavier name weight /
   subtle tint; marginal rows lighter. Hierarchy via size/contrast, not color alone.
   *(`visual-hierarchy`, `color-not-only`)*
3. **Inline row action cluster — Approve · Reject · Note** (Gmail-style quick actions),
   mapping to the production review fields (status + note):
   - **Approve (✓)** — emphasized primary, semantic success. Sets status `approved`
     (→ Affinity). One click, optimistic; row flips to `✓ Approved`. *(`primary-action`)*
   - **Reject (✕)** and **Note (✎)** — quiet **ghost icons**, visually subordinate so three
     icons don't flatten the hierarchy. *(`destructive-emphasis`)*
   - **Note (✎)** opens a small **popover** (progressive disclosure); shows a filled state
     (`✎•`) when a note exists.
   - The **drawer stays the full review form** — feedback *reasons* (good / wrong-fund /
     needs-context), longer notes, and the `hold / in-review` decisions live there.
   - **Icon-button guardrails (required):** SVG not emoji; per-button `aria-label` +
     keyboard tooltip; ✓/✕ differ in **shape** not just color; ≥44px hit area + ≥8px gap;
     persistent (not hover-only); **Reject fires an Undo toast** (`undo-support`).
     Already-reviewed rows show `FounderReviewStateBadge` instead of the cluster.
4. **"N approved → Affinity" session counter** + CSV export via production `exportFoundersCsv`.

### v1 mockup
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ★ STRONG FIT — approve into Affinity                                 5 people  │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│   Dr. Mei Lin                  [PLVS]  ▓▓▓▓▓▓▓▓▓▓│▓ 96%        ✓ Approved        │
│   Tomás Herrera                [PLVS]  ▓▓▓▓▓▓▓▓▓▓│  94%   ·in-review  (✓) ✕ ✎    │
│   Aisha Bello            [Neuro][PLVS] ▓▓▓▓▓▓▓▓▓▓│  92%   ·in-review  (✓) ✕ ✎•   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ● PROMISING — review                                                 6 people  │   ← cut-line
│   Hannah Okonkwo               [Crypto]▓▓▓▓▓▓▓▓│    83%   ·hold       (✓) ✕ ✎    │
│   …  (the │ on each bar marks the 85% strong-fit line)                          │
├──────────────────────────────────────────────────────────────────────────────┤
│   Marginal (< 70%)                                       ▸ de-emphasized rows   │
│   Greta Olsen                  [Neuro] ▓▓▓▓▓░░░░    47%   ·rejected             │
└──────────────────────────────────────────────────────────────────────────────┘
   row actions:  (✓) Approve (emphasized) · ✕ Reject (ghost) · ✎ Note (✎• = note exists)
                          3 approved → Affinity · [Export CSV]
```

### v1 interaction notes
- **Sort:** tiers only make sense on Alignment-desc. On any other sort, collapse the tier
  headers and keep just the bars.
- **Marginal (<70%):** present but de-emphasized; optionally collapsed behind "Show N marginal."
  Never removed — removing it reintroduces the "leftovers list" duplication problem.
- **Approve in place:** flip the row to `✓ Approved`; don't move it (avoids row-jump).

### v1 implementation checklist
- [ ] Extend v0's tiered list: compute tier per row (≥85 / 70–84 / <70); render tier headers.
- [ ] Add the 85% **threshold marker** to `AlignmentBar`; muted variant for marginal rows.
- [ ] Top-tier emphasis + marginal de-emphasis (weight / tint / text color via tokens).
- [ ] `RowActions` cluster: Approve (✓, emphasized) · Reject (✕, ghost) · Note (✎, ghost),
      with all icon-button guardrails above.
- [ ] Local review state (Map of founderId → decision + note, optimistic); Approve flips to
      `✓ Approved`; Reject → Undo toast; Note → popover + `✎•`; "N approved → Affinity" counter.
- [ ] Already-reviewed rows render `FounderReviewStateBadge` instead of the cluster.
- [ ] Name click opens the existing drawer for full review (feedback reasons / hold / long note).
- [ ] On non-alignment sort: collapse tiers, keep bars.
- [ ] `npx tsc --noEmit` clean; check at 375px.

---

## Reuse plan (per `prototypes/CLAUDE.md` — applies to both)

- **Imported directly (pure):** `KpiSummaryStrip`, `DashboardPagesLayout`,
  `FounderReviewStateBadge`, `FounderSignalBadges`, `LabOsBadge`, `Markdown`,
  `exportFoundersCsv`, `FUND_LABEL`/`getFundTag`/`founderHeadline`, and the review-channel
  constants (`REVIEW_CHANNEL_LABEL`, `RECORD_QUALITY_FIELDS`, `PLATFORM_FEEDBACK_AREAS`).
- **Copied + simplified (data-bound → mock):** `FounderTable`, `FoundersTableSection`,
  `FoundersFilterRail`, `FounderColumnChooser`, `FounderDrawer` + channel-based
  `ReviewActionsPanel`, `FounderMethodologyModal`. Each imports its production `.module.scss`.
- **New (local) SCSS:** `AlignmentBar` + cut-line (v0); threshold marker, tier headers,
  row-action icons (v1) — token+fallback palette (`var(--name, #fallback)`), no raw hex.
- Mock data carries the new fields (headline, pedigree, thesis, signal flags, last-signal,
  PLN proximity) **plus alignment %** for v0. **No warm intros** (no founder engine for them).

## Rejected alternative (kept for the record)

**Band above the table** ("Top fits" section above the full table). **Rejected — duplicates:**
top founders appear in the band *and* at the top of the table. Fixes are worse (remove-from-table
→ leftovers + arbitrary cutoff; or accept duplication). A segmented `Strong · Promising · All`
toggle on the one table is an acceptable duplication-free variant, but the inline cut-line keeps
all rows in one scannable spine and is preferred.

## Open questions (confirm at build time)
- **Validate re-introducing Alignment with the team.** Production deliberately removed the
  Alignment column and sorts by recency; v0 reverses that. Confirm the goal still holds.
- Final thresholds (85 / 70 proposed).
- **v1 Approve granularity:** is one-click inline Approve OK, or must every approval capture
  feedback/note via the drawer? (Production allows feedback+note; inline is a deliberate speed-up.)
- **v1 Hold:** the row cluster is Approve / Reject / Note; `hold` + `in-review` stay drawer-only
  to keep it to three icons. Confirmed OK for now (revisit if Hold is a frequent quick action).
- **v1 Marginal:** collapsed behind "Show N marginal" by default, or always visible + de-emphasized?
