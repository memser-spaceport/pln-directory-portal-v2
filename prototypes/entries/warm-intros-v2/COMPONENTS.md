# warm-intros-v2 — reuse map

Clone of the production **Warm Intros v2** workspace
(`components/page/investors/WarmIntrosV2Workspace/`) running on mocked data.

The rule here: **nothing about the visual layer is re-created.** Every class name and
every `.module.scss` comes from production, so the prototype drifts only when
production drifts.

## Imported straight from production (do not copy into this folder)

| What                                                         | Path                                                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Results table **styles**                                     | `@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2Table.module.scss`                                     |
| Glossary drawer                                              | `…/WarmIntrosV2GlossaryDrawer`                                                                                        |
| Score % pill                                                 | `…/ScorePercentPill`                                                                                                  |
| Person chip (+ Directory-member dot)                         | `…/PathProfileChip`                                                                                                   |
| Hop role pill (PL Member / Founder / Co-investor / Investor) | `…/HopRoleBadge`                                                                                                      |
| Co-investment parsing                                        | `…/masterProfileDisplay.util` → `parseCoInvestments`                                                                  |
| CSV export                                                   | `…/exportWarmIntrosV2Csv`                                                                                             |
| hopChain parsing + proximity derivation                      | `…/parseWarmPathHopChain`                                                                                             |
| MasterProfile display helpers                                | `…/masterProfileDisplay.util`                                                                                         |
| Workspace / drawer / modal styles                            | `…/WarmIntrosV2Workspace.module.scss`, `…/WarmIntrosV2InvestorDrawer.module.scss`, `…/MasterProfileModal.module.scss` |
| Proximity badge                                              | `@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge`                                                   |
| Sector chips                                                 | `@/components/page/investors/SectorTagsList/SectorTagsList`                                                           |
| Filter dropdowns                                             | `@/components/common/filters/FilterSelect/FilterSelect`                                                               |
| Drawer / Modal / CopyButton                                  | `@/components/common/Drawer/Drawer`, `@/components/common/Modal`, `@/components/ui/CopyButton`                        |
| Avatar fallback                                              | `@/hooks/useDefaultAvatar` → `getDefaultAvatar`                                                                       |
| Types + target-set constants                                 | `@/services/investors/warm-intros-v2.types`                                                                           |

## Transcribed here (only because production calls the API)

| File                         | Production source                | What changed                                                                                                                                                                                               |
| ---------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WarmIntrosV2Prototype.tsx`  | `WarmIntrosV2Workspace.tsx`      | `useQueryStates` (nuqs) → `useState`; `useWarmIntrosV2Paths` / `useWarmIntrosV2Facets` / `useGetInvestorLists` → mock selectors; infinite scroll dropped (14 rows fit one page); PostHog analytics dropped |
| `InvestorDrawerMock.tsx`     | `WarmIntrosV2InvestorDrawer.tsx` | `useWarmIntrosV2PathsForInvestor` + `useMasterProfile` → mock lookups                                                                                                                                      |
| `MasterProfileModalMock.tsx` | `MasterProfileModal.tsx`         | `useMasterProfile` → `MOCK_MASTER_PROFILES[uid]`; loading / error branches are inert                                                                                                                       |
| `WarmIntrosV2TableMock.tsx`  | `WarmIntrosV2Table.tsx`          | **Team** and **Industry / Sector** columns removed (a design change, not a data one); firm · role folded under the investor name; column widths re-balanced in `TableColumns.module.scss`                  |

## New UI (prototype still; production twin shipped)

Production counterparts live under
`components/page/investors/WarmIntrosV2Workspace/`:

| Prototype                  | Production                                                       |
| -------------------------- | ---------------------------------------------------------------- |
| `PathFeedback.tsx`         | `PathActions.tsx` (+ `PathFeedbackAdminSummary.tsx` for editors) |
| `PathFeedbackModal.tsx`    | `PathFeedbackModal.tsx`                                          |
| `PathFeedback.module.scss` | `PathFeedback.module.scss`                                       |
| —                          | `PathFeedbackQueuePanel.tsx` (admin queue; `investor_db.edit`)   |

Prototype keeps an in-memory `FEEDBACK_STORE`. Production wires
`PUT/DELETE …/warm-intros-v2/paths/:uid/feedback` and enriches investor detail with
`myFeedbackByConnector` / `feedbackSummaryByConnector`.

| File                       | What it is                                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PathFeedback.tsx`         | The action strip at the foot of every grey path card (`.pathItem`): `Can you refer?` → inline Yes / No, an answered state with Undo, and the `Give feedback` link |
| `PathFeedbackModal.tsx`    | The feedback modal — the path restated as avatar chips, and one free-text box with a 600-char counter                                                             |
| `PathFeedback.module.scss` | Styling for both. New UI, so every color is a `var(--token, #fallback)` pair per `prototypes/CLAUDE.md` §3–4                                                      |

Design intent, so it doesn't get re-litigated:

- **No pencil.** Nothing on the card is editable — you're reporting that the graph
  is wrong — so the affordance is a labelled `Give feedback` link, not an edit icon.
  It stays a quiet text button because the card repeats for every alternate.
- **At rest the strip is two text links in the card's right corner.** Neither action
  gets clicked often, so neither gets a bordered button. Clicking `Can you refer?`
  promotes the question to the left of the row, where Yes / No do get real button
  affordance; `Give feedback` stays pinned right so it never changes position.
- **The modal restates the path with the drawer's own avatar chips** (`PathProfileChip.module.scss`
  - the drawer's `.chain` / `.node` / `.arrow`), rendered as spans. `pointer-events: none`
    drops the affordance without touching production's chip colors — mid-report is no
    place to navigate off to a profile.
- **Free text only.** The modal is one box. Nothing is pre-categorised, so whatever
  is wrong gets said in the reporter's own words rather than squeezed into a chip.
- **`No` asks no follow-up.** The verdict is the signal. A "Why not?" chip row was
  a second question competing with `Give feedback` — the affordance already sitting
  on the same row and built to answer it.
- **Answers replace the question.** Answering shows the answer plus Undo rather than
  resetting, so the same path doesn't get answered twice. `FEEDBACK_STORE` (a module
  Map standing in for the mutation) keeps that across drawer open/close.
- Chrome is the shared content-modal pattern (`SubmitDealModal.module.scss` + `Modal`),
  the same one `MasterProfileModalMock` uses. `Modal` binds Escape in the capture phase
  with `stopImmediatePropagation`, so Esc closes the modal and leaves the drawer open.

Markup inside those three is a verbatim transcription — if you change the shape of a
row or a section, change it here on purpose, not by accident.

## Synced from dev — co-investment filters (`268306185`, Aug 2026)

Production grew a path-shape axis. The prototype tracks it:

| Dev change                                                                               | Where it landed here                                                                                     |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Quick-filter chips: Founder bridge · Co-investor bridge · PL/FIL investors · Direct only | `WarmIntrosV2Prototype.tsx` (`s.quickFilters` / `s.quickChip`, mutually exclusive exactly as production) |
| `relationKind` / `directOnly` / `plBacker` list params                                   | `filterPaths()` in `mocks.ts`                                                                            |
| Two-hop bridge paths + `F+2` / `VC+2` proximity families                                 | `buildRow()` uses production's `hopCountFromRelationKind` + `proximityFamilyFromRelationKind`            |
| `HopRoleBadge` beside each hop chip                                                      | table + drawer, wrapped in `s.pathHop`                                                                   |
| Directory-member dot (`memberUid` on `PathProfileChip`) + `PL Network` row badge         | `WarmIntrosV2TableMock.tsx`                                                                              |
| `MasterProfile.coInvestments`                                                            | drawer `s.coInvestBlock`, modal "Co-investments with PL" section                                         |
| Alternates carry their own `relationKind`                                                | drawer derives the alt's code + role badge from it                                                       |

No new local CSS: every class above already exists in the production modules this
prototype imports.

The table now renders the **hopChain** rather than connector → investor, so a
founder or co-investor bridge shows all three chips. The two-chip branch is kept
as production keeps it — a fallback for rows with no parsed chain.

## Design change on top of dev — the filter bar

Dev's bar asks "how does this intro get made?" **twice**: the `PL member` select
answers it by person, three chips answer it by shape. They are one axis, so here
they are one control — `PathViaSelect.tsx`, a grouped selector:

| Group                 | Options                                    |
| --------------------- | ------------------------------------------ |
| Path type             | Direct · Via a founder · Via a co-investor |
| PL member             | the six connectors                         |
| Founder / co-investor | the five bridge people                     |

This is the mediation axis as originally specced in `warm-intros-filter-update`
(one grouped selector, teammates and founders together), with dev's third kind
folded in. Single-select, so there is nothing beside it to silently clear — dev's
chips null two sibling filters per click with no feedback.

`Backed PL/FIL` stays a separate toggle: it describes the _investor_, not the
route to them, so it is not a fourth pretend-shape on the axis.

**Counts are honest.** `pathViaFacets` / `sectorFacets` / `plBackerCount` each
count against the _other_ live filters via `filterPaths(filters, omit)`, so an
option reading `(3)` returns three rows. Dev's `facetsForTargetSet` keyed off the
target set alone and kept showing stale counts under an active chip.

Also: active-filter pills + `Clear all` (imported from Warm Intros **v1**, which
already has `.filterPills` / `.pill` / `.pillRemove` / `.clearAll`), the empty
state carries a recovery action, `Export CSV` moved onto the results line where
it acts on the result set rather than changing it, and the search placeholder now
admits it matches the firm too.

Dropped from dev: the `directOnly` param (it is `relationKind: 'pl_direct'` by
another name) and `.quickChipToggle`'s dashed border (a third visual state with
no meaning once position carries it).

Local CSS is `FilterBar.module.scss` — layout only, plus a 40px height and a
disabled state for the one toggle, because production's 32px `.quickChip` sits
beside 40px selects here and never defined `:disabled`.

## Design change on top of dev — two columns, not five

| Production column       | Where it went                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Team, Industry / Sector | dropped; sectors remain in the drawer                                                                        |
| firm · role             | under the investor name                                                                                      |
| email                   | drawer + CSV only — nobody reads an address at a glance, and it mostly re-encoded the firm on the line above |
| Proximity               | the joined badge now **leads** the path cell                                                                 |

Proximity moved because the code _is_ a description of the chain: family = which
bridge, `+N` = hops, `A`/`B` = caliber. Leading position is what makes it work —
the badge's left edge lands at the same x on every row, so the top-to-bottom scan
a dedicated column was buying survives without spending a column on it. Only the
code's own width varies (`F+2A` is a character shorter than `PL+1A`), ~8px of
jitter. Trailing the chain instead would scatter it across a variable-width row.

Freeing the column pays for itself: Path goes 48% → 68%, so even after the badge
takes ~95px the chain has more room than it had before.

## Design change on top of dev — proximity + score joined, not merged

`ProximityCodeBadge` has a `confidence` prop that renders the % **inside** the
badge. Not used, deliberately: inside, the % inherits the **caliber** colour,
which collapses the score band from three levels to two — yellow and red become
one, so a 33% path reads identically to a 12% one. The filtering already cuts at
20%, so that is a line someone drew on purpose.

Instead the two stay separate elements butted together (`joinGroup` / `joinLeft` /
`joinRight` in `TableColumns.module.scss`): no gap, inner corners squared, heights
matched. One shape, two signals — caliber on the left, band on the right. Where
they agree (caliber A is always >60, so A pairs with green) the fills match and
the seam simply disappears.

Joined only when both halves exist; a lone score pill with one squared edge would
look broken.

## Design change on top of dev — path evidence (`PathEvidence.tsx`)

Two gaps in what dev shows about _why_ a path is claimed:

**Reason provenance.** The payload puts `sourceType` on every reason and
`parseWarmPathHopChain` reads it — `pickPrimaryReasonDescription` even prefers
`webVerify` — but nothing ever rendered it. The drawer flattens reasons to strings
via `allReasonDescriptions`, so a web-verified fact and a model's guess arrive
looking identical. `ReasonList` keeps the pairing and prints the source after each
line: `Web-verified` · `Shared event` · `Model-inferred`. Only the model-inferred
one is italicised — a guess shouldn't read with the authority of a record.

**Shared events.** `MasterProfile.events` exists per person and the modal lists it,
but nothing computed the _overlap_ — you'd open both profiles and compare by eye.
`SharedEventsNote` derives the intersection for each adjacent pair and reports it
under the chain, because a shared event is a property of the **edge**, not of
either person.

> Copy rule: **"Both attended", never "met at".** Two people at a conference with
> a few thousand attendees did not necessarily meet, and a UI that says they did is
> asserting something the data cannot support. That is how someone sends a warm
> intro request that lands cold.

`EVENTS_BY_PROFILE` in `mocks.ts` is the single source for both the modal's event
list and the derived overlap, so the two can never disagree. Overlaps are sparse
on purpose — if everyone shared LabWeek the note would fire on every row and mean
nothing. Seed `reasons` now accept `{ text, source }` alongside a bare string, so a
seed can state its own provenance instead of inheriting the positional default.

## Design change on top of dev — role labels cut to what carries information

Dev renders `HopRoleBadge` after every hop chip — ~34 bordered pills across 14
rows.

**Only one of them is redundant: the last.** The final hop is the row's own
investor by definition, so labelling it restates the subject of the row.

Every other position is information. **A path does not have to start at a PL
member** — `Founder → Investor` is a shape the backend emits, and production's own
drawer builds its alternates exactly that way. `role` is a free-form string on the
payload (`parseWarmPathHopChain.ts`) with nothing constraining hop 0, so
`PathRole.tsx` reads it and never infers it from index.

> An earlier revision of this prototype dropped the first hop's label on the
> reasoning that "hop 0 is always the PL member". That was generalised from this
> file's own mock data, which only emitted the 3-node chain. It is wrong, and
> `bridgeLeads` now exists so the 2-node shape is represented here too.

What does change is weight, not presence: the label loses its pill chrome and
becomes a caption under the name — the shape Workable / Aboard / Peerlist use for
a role that appears on every row.

No colour system for roles. Proximity already colour-codes by caliber, and a
second palette competing with the load-bearing one is what made the column noisy.
Icon-only was rejected too: a dot works for binary status, not a four-way role,
and it would carry meaning in colour alone.

`.chainTop` overrides production's `align-items: center` on the chain — once one
hop is two lines tall, centring lifts its chip off the line the others sit on.

**Knock-on:** with the `Investor` role badge gone from the Path column, the violet
the `Backed PL/FIL` pill borrows no longer echoes anywhere else in the row.

## Design change on top of dev — PL backing made visible

Dev added `plBacking` as a **filter with no display**: nothing in the table,
drawer or profile ever renders it, so the only way to learn an investor backed
Filecoin is to toggle the chip and see who survives. `PlHistory.tsx` shows the
fact, which demotes the toggle to an ordinary filter over something visible.

| Surface             | What it shows                                                               |
| ------------------- | --------------------------------------------------------------------------- |
| Table row           | Third fact-line under firm · title and email: the pill + `N co-investments` |
| Investor drawer     | Pill beside the `Co-investments with PL` heading                            |
| MasterProfile modal | Same, on the section title                                                  |

The heading falls back to `Relationship with PL` when an investor is a backer but
has no recorded co-investments, so the block never announces a count of zero.

Label is `Backed PL` / `Backed Filecoin` / `Backed PL + FIL` — "backer" alone
loses the useful half. `matchKind` (firm vs person) rides in the tooltip rather
than lengthening the pill.

**Colour.** Amber was the obvious pick and is wrong: `.listGold` already carries
`Gold PLC` two lines above it in the same cell. Every other tone is load-bearing
too — green is "directory member", indigo is the Neuro list, and the Proximity
column owns green/yellow/red. So the pill borrows `HopRoleBadge`'s `.badge` +
`.investor` violet: unspoken-for inside the investor cell, and the same 10px
shape as `.directoryBadge`. It does share that violet with the `Investor` hop
badge over in the Path column — different column, explicit label, and the least
bad of the options.

### Deliberate deviation from production's visual layer

This is the **one** place the prototype overrides a production style rather than
importing it, so it is called out rather than left to be discovered.

Production's `.coInvestBlock` is a filled amber box — `#fff7ed` on `#fed7aa`,
label `#c2410c`. Dev's logic is sound in production: that exact triplet is
`HopRoleBadge`'s `.coInvestor`, so orange consistently means co-investor.

Three things break it here:

1. **A filled amber box with an amber border is the shape of a warning.** This is
   good news — an existing relationship with PL — and it's the only tinted box in
   the drawer, so it alerts on the section that should reassure.
2. **The link it depends on is gone.** Orange-means-co-investor only reads if the
   orange co-investor badge is nearby; role badges became plain grey captions, so
   `.coInvestor` orange renders nowhere in this drawer.
3. **Amber is already spoken for** by the `Gold PLC` list chip.

`h.coInvestPlain` swaps the fill for the hairline the drawer already uses
elsewhere. **Take this back to dev as a proposal** — do not let it become silent
drift.

**Count as a chip on the name line.** The co-investment count moved up beside the
list chip, reusing the drawer's own `.count` so the number is the same object on
both surfaces. It carries the violet marker rather than a bare digit — next to a
list chip, a lone "3" would read as "3 lists" — and it retires the repeated
"co-investments" noun that used to run down the column. The backing mark keeps
the third line to itself.

**Colour budget.** The cell had four hues in ~60px — blue name, green
`PL Network`, amber list badge, violet backing — so nothing receded. Two cuts
fixed it: the `PL Network` badge went (the investor's own chip in the Path column
already carries the green Directory dot, so the row said it twice), and the
backing text dropped to neutral grey with only the 6px marker keeping the violet.
What's left is one blue name, one amber badge, one small dot.

> Tradeoff taken knowingly: a dot is less discoverable than the words
> "PL Network". It has a tooltip. If Directory membership turns out to be
> something people act on rather than notice, the badge comes back and something
> else gives.

**Marker, not a pill.** Attio renders connection strength as a small coloured
glyph plus plain words — no border, no fill. Once the email line came out, a
filled pill here was the loudest thing in the cell after the name, over-weighting
a secondary fact. One treatment on all three surfaces, so the same fact never has
two looks.

**The repeated noun is handled by weight, not by deletion.** `co-investments`
repeats down the column while only the number changes. Cutting the word leaves an
ambiguous bare digit, and a shorter synonym would contradict the drawer's
"Co-investments with PL" — so the numeral takes the primary ink and the noun sits
in tertiary grey. You scan the digits; the word becomes texture.

## Mock data (`mocks.ts`)

- 14 investors across the two real target sets (`neuro-fund-i`, `gold-co-investors`)
- 6 PL connectors, mirroring the "six connectors" the glossary describes
- 5 bridge people (3 founders, 2 co-investors) — the middle hop, each with its own
  MasterProfile so the middle chip opens something
- 5 rows are bridges (3 founder, 2 co-investor); 4 investors carry `plBacking`,
  4 carry `coInvestments`, so every quick filter returns a non-empty set
- `derivePathProximity()` (production) generates every `proximityCode`, `caliber`,
  `scorePercent` and `scoreBand`, so band colors match production rules exactly
- `hopChain` uses the real shapes: `pl_direct` (1 hop), `founder_bridge` and
  `coinvestor_bridge` (2 hops) — `hops` / `reasons` / `alternates`
- A `MasterProfileDetail` exists for every investor **and** connector, so every chip
  in the table and drawer opens a populated modal
- All names, firms, emails and Affinity ids are invented

## Local CSS

`TableColumns.module.scss` and `FilterBar.module.scss`.

`TableColumns.module.scss` — three column widths and the table's `min-width`,
needed because production's 22/18/18/14/28 split assumed five columns. Layout values
only, no colors, so there is nothing to token-swap. Any _new_ styling beyond this
must use `var(--token, #fallback)` pairs per `prototypes/CLAUDE.md` §3.
