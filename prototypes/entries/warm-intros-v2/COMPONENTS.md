# warm-intros-v2 — reuse map

Clone of the production **Warm Intros v2** workspace
(`components/page/investors/WarmIntrosV2Workspace/`) running on mocked data.

The rule here: **nothing about the visual layer is re-created.** Every class name and
every `.module.scss` comes from production, so the prototype drifts only when
production drifts.

## Imported straight from production (do not copy into this folder)

| What | Path |
| --- | --- |
| Results table **styles** | `@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2Table.module.scss` |
| Glossary drawer | `…/WarmIntrosV2GlossaryDrawer` |
| Score % pill | `…/ScorePercentPill` |
| Person chip | `…/PathProfileChip` |
| CSV export | `…/exportWarmIntrosV2Csv` |
| hopChain parsing + proximity derivation | `…/parseWarmPathHopChain` |
| MasterProfile display helpers | `…/masterProfileDisplay.util` |
| Workspace / drawer / modal styles | `…/WarmIntrosV2Workspace.module.scss`, `…/WarmIntrosV2InvestorDrawer.module.scss`, `…/MasterProfileModal.module.scss` |
| Proximity badge | `@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge` |
| Sector chips | `@/components/page/investors/SectorTagsList/SectorTagsList` |
| Filter dropdowns | `@/components/common/filters/FilterSelect/FilterSelect` |
| Drawer / Modal / CopyButton | `@/components/common/Drawer/Drawer`, `@/components/common/Modal`, `@/components/ui/CopyButton` |
| Avatar fallback | `@/hooks/useDefaultAvatar` → `getDefaultAvatar` |
| Types + target-set constants | `@/services/investors/warm-intros-v2.types` |

## Transcribed here (only because production calls the API)

| File | Production source | What changed |
| --- | --- | --- |
| `WarmIntrosV2Prototype.tsx` | `WarmIntrosV2Workspace.tsx` | `useQueryStates` (nuqs) → `useState`; `useWarmIntrosV2Paths` / `useWarmIntrosV2Facets` / `useGetInvestorLists` → mock selectors; infinite scroll dropped (14 rows fit one page); PostHog analytics dropped |
| `InvestorDrawerMock.tsx` | `WarmIntrosV2InvestorDrawer.tsx` | `useWarmIntrosV2PathsForInvestor` + `useMasterProfile` → mock lookups |
| `MasterProfileModalMock.tsx` | `MasterProfileModal.tsx` | `useMasterProfile` → `MOCK_MASTER_PROFILES[uid]`; loading / error branches are inert |
| `WarmIntrosV2TableMock.tsx` | `WarmIntrosV2Table.tsx` | **Team** and **Industry / Sector** columns removed (a design change, not a data one); firm · role folded under the investor name; column widths re-balanced in `TableColumns.module.scss` |

## New UI (prototype still; production twin shipped)

Production counterparts live under
`components/page/investors/WarmIntrosV2Workspace/`:

| Prototype | Production |
| --- | --- |
| `PathFeedback.tsx` | `PathActions.tsx` (+ `PathFeedbackAdminSummary.tsx` for editors) |
| `PathFeedbackModal.tsx` | `PathFeedbackModal.tsx` |
| `PathFeedback.module.scss` | `PathFeedback.module.scss` |
| — | `PathFeedbackQueuePanel.tsx` (admin queue; `investor_db.edit`) |

Prototype keeps an in-memory `FEEDBACK_STORE`. Production wires
`PUT/DELETE …/warm-intros-v2/paths/:uid/feedback` and enriches investor detail with
`myFeedbackByConnector` / `feedbackSummaryByConnector`.

| File | What it is |
| --- | --- |
| `PathFeedback.tsx` | The action strip at the foot of every grey path card (`.pathItem`): `Can you refer?` → inline Yes / No, an answered state with Undo, and the `Give feedback` link |
| `PathFeedbackModal.tsx` | The feedback modal — the path restated as avatar chips, and one free-text box with a 600-char counter |
| `PathFeedback.module.scss` | Styling for both. New UI, so every color is a `var(--token, #fallback)` pair per `prototypes/CLAUDE.md` §3–4 |

Design intent, so it doesn't get re-litigated:

- **No pencil.** Nothing on the card is editable — you're reporting that the graph
  is wrong — so the affordance is a labelled `Give feedback` link, not an edit icon.
  It stays a quiet text button because the card repeats for every alternate.
- **At rest the strip is two text links in the card's right corner.** Neither action
  gets clicked often, so neither gets a bordered button. Clicking `Can you refer?`
  promotes the question to the left of the row, where Yes / No do get real button
  affordance; `Give feedback` stays pinned right so it never changes position.
- **The modal restates the path with the drawer's own avatar chips** (`PathProfileChip.module.scss`
  + the drawer's `.chain` / `.node` / `.arrow`), rendered as spans. `pointer-events: none`
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

## Mock data (`mocks.ts`)

- 14 investors across the two real target sets (`neuro-fund-i`, `gold-co-investors`)
- 6 PL connectors, mirroring the "six connectors" the glossary describes
- `derivePathProximity()` (production) generates every `proximityCode`, `caliber`,
  `scorePercent` and `scoreBand`, so band colors match production rules exactly
- `hopChain` uses the real `pl_direct` shape: `hops` / `reasons` / `alternates`
- A `MasterProfileDetail` exists for every investor **and** connector, so every chip
  in the table and drawer opens a populated modal
- All names, firms, emails and Affinity ids are invented

## Local CSS

`TableColumns.module.scss` only — three column widths and the table's `min-width`,
needed because production's 22/18/18/14/28 split assumed five columns. Layout values
only, no colors, so there is nothing to token-swap. Any *new* styling beyond this
must use `var(--token, #fallback)` pairs per `prototypes/CLAUDE.md` §3.
