# Dev handoff — warm-intros-filter-update

People-first redesign of the Warm Intros workspace (table + investor drawer). Every path is
described by **who you reach**, not a company hop-chain. Mocked data only; no API/store/auth.

**Imported** = production component used as-is. **SCSS-only** = data layer not reusable
(react-query/store/closed API) so we import the `.module.scss` and feed mock data. **Copied** =
markup replicated because the source isn't exported. **New** = prototype-only, needs a real impl.

---

## Files (all under `prototypes/entries/warm-intros-filter-update/`)

| File | Role |
|---|---|
| `WarmIntrosFilterUpdatePrototype.tsx` | Page: filter bar, results table, mobile cards, drawer wiring |
| `WarmPathPanel.tsx` | Drawer "Warm paths" — per-path card: connector / org card + contacts |
| `PeopleChain.tsx` | The route node-chip renderer (the 4 node states below) |
| `InvestorDrawerMock.tsx` | Investor detail drawer (sticky header + sections) |
| `AddToListButton.tsx` | Add/remove-to-list popover (bulk + drawer) |
| `WorkspaceSearch.tsx` | Connector/investor typeahead (lens filter) |
| `ArrowUpRightIcon.tsx` | ↗ glyph copied from prod `OutreachInvestorTable` |
| `mocks.ts` | **The data model** — read this first (types + factory) |
| `WarmIntrosImprovements.module.scss` | All net-new styles |

---

## Data model (`mocks.ts`) — the important part for dev

- `ContactPerson` — a person to reach. Key fields:
  - `memberUid?` → **present = in PL network** (avatar + `/members/:uid`); **absent = external** (grey user icon, no link).
  - `teams?: TeamLink[]` — orgs/firms the person is affiliated with, rendered as inline links in the role line. `TeamLink = { name, teamUid?, logo? }` (`teamUid` → `/teams/:uid`).
- `OrgConnector` — used when we know a company can route the intro but **not who**:
  `{ name, teamUid?, logo?, description, tags[], email?, website? }`. `teamUid` present ⇒ PL-network org (logo + link); absent ⇒ external firm (dashed building glyph).
- `MockPath` — one route. `contact?` (person) **or** `orgConnector` (org). `chain` is kept only for the connector-lens search.
- `RouteNode` / `connectorNode(path)` / `investorNode(inv)` / `pathChainNodes(path, inv)` — build the chain shown in the table (`[connector, investor]`).
- `fourCasePaths(firstName, firm)` + the `MOCK_MEMBERS` map — **demo scaffolding**: every path-having investor is given the standard case set so all states are visible. Real data will have organic per-investor paths; drop this factory when wiring real data.

## The node states (how a connector renders)

| State | Condition | Visual |
|---|---|---|
| **Member known** | `contact.memberUid` set | avatar + name, links to `/members/:uid` (inline ↗) |
| **Member unknown** | `contact`, no `memberUid` | grey user icon + name, no link |
| **Org unknown** | `orgConnector`, no `teamUid` | dashed building glyph + name + `?`, not linked |
| **Org known** | `orgConnector` + `teamUid` | real logo + name + `?`, links to `/teams/:uid` *(rendering exists; not used in current demo data)* |

---

## Imported (production, used as-is)
- `Drawer`, `Button`, `Tabs` — `@/components/common/*`
- `CopyButton`, `Tag` — `@/components/ui/*` (Tag = relationship + sector filter chips, `variant="secondary"` + `selected`)
- `ProfileSocialLink` — `@/components/page/member-details/profile-social-link` (email/linkedin/telegram channels)
- `ProximityCodeBadge`, `EngagementTierBadge`, `EmailStatusPill`, `SectorTagsList`, `ListPicker`, `GlossaryModal` — `@/components/page/investors/*`

## Imported helpers / tokens
- `getContactLogoByProvider` — `@/utils/profile/getContactLogoByProvider`
- `getProfileFromURL` — `@/utils/common.utils`
- `getDefaultAvatar` — `@/hooks/useDefaultAvatar`
- Constants/types — `@/services/investors/{constants,types}`

## SCSS-only (style reused, component mocked)
- `WarmIntrosWorkspace.module.scss` (`s`) — workspace shell, filters, table, `.btn`/`.btnPrimary`
- `InvestorDrawer.module.scss` (`s`) — drawer layout/sections
- `WarmPathDetail.module.scss` (`pd`) — path card, chain (`.chain`/`.node`/`.arrow`/`.nodeLabel`)
- `WorkspaceTypeahead.module.scss` — search input + dropdown
- `Button.module.scss` (`btn`) — applied to anchors that can't be `<Button>`

---

## Behaviors a dev must wire to real data/routes
- Links are **placeholder routes**: `/members/:uid`, `/teams/:uid` (also used for external firms in the demo — real impl should point external firms at a company route, not `/teams`).
- **Sticky investor header** in the drawer (`.stickyHeader`) — keep on real drawer.
- **Teams inline + "+N more"** in the role line (expand/collapse), each a `/teams` link.
- **Per-path "Show N more paths"** (drawer shows the warmest, collapses the rest).
- Stubbed: **"Suggest a correction"** (opens correction form in prod), **"Open in Affinity"**, **Export CSV**, **Add to list** (local state only).

## Removed vs the earlier variant
- **Save View** dropped (filter clutter; the team agreed it wasn't needed here).
- **Collapsible row** dropped — only the drawer remains.
- The in-drawer company hop-chain dropped (it repeated names already on screen).

## DS notes (overrides to lift back into the design system, then delete)
- Search magnifier icon + on-scale `14px` type; `<select>` custom chevron + `14px` (prod uses native chevron + 13px). Implemented as `!important` overrides on imported prod classes so they're easy to remove once adopted.
- Inherited prod gaps kept on purpose to track dev: `#e5e7eb` borders (not a PL token), `13px` tab type.
- Prototype color rule: every color is `var(--token, #fallback)` — the fallback renders today, the token wires up when the app adopts the DS.
