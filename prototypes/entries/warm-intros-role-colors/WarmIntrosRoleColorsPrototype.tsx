'use client';

/**
 * Warm intros — role-coloured nodes.
 *
 * The same workspace as `warm-intros-v2`, rendered through the same components on
 * the same rows, with one variable changed: whether a hop chip says what *kind*
 * of person it is in colour as well as in words.
 *
 * Why a second entry rather than a control inside the first: `warm-intros-v2` is
 * the mocked clone dev reads to check behaviour against production. Adding a
 * live colour switch to it would mean every screenshot of it needs a caption
 * saying which mode it was in. This entry imports that prototype whole — not a
 * fork, not a copy — and wraps it in `RoleColorProvider`, so the two can never
 * drift: any change to the workspace lands here the same day.
 *
 * ── What is being tested ─────────────────────────────────────────────────────
 * `PathRole.tsx` opens by refusing exactly this: *"No colour system here on
 * purpose. Proximity already colour-codes by caliber, and a second palette
 * competing with the load-bearing one is how the column got noisy in the first
 * place."*
 *
 * Half of that objection has since been removed by hand: the proximity code and
 * its caliber palette are gone from every prototype, leaving `ScorePercentPill`
 * as the only other colour in the cell. That is a smaller thing to compete with —
 * one pill at the head of the row, three bands, and a *quantity* rather than a
 * category. It is not nothing, though: a green 91% and a green Founder chip still
 * sit on the same line meaning unrelated things, which is worth judging on the
 * `fill` tab specifically.
 *
 * ── Where the hues come from ─────────────────────────────────────────────────
 * Not invented — but production has two candidate palettes and they contradict
 * each other. `HopRoleBadge.module.scss` (role pills beside path hops) says
 * founder green / co-investor orange / investor violet. `MasterProfileModal`
 * (the type pills on the profile) says founder **orange** / co-investor **cyan**
 * / investor **green**. Only PL member agrees: indigo in both.
 *
 * These chips follow the modal, because the modal is what a chip opens. Violet
 * here and green one click later, for the same person, would be a colour system
 * you re-learn on navigation.
 *
 * Every role is tinted, the investor included — even though it is the last hop of
 * every chain and so never distinguishes one row from another. That was the case
 * for leaving it neutral, and it is the wrong frame: the hue here is a convention,
 * not a signal. Someone who has opened one MasterProfile knows green means
 * investor, and a grey chip where they expect green costs a beat of "why not?".
 * Totality is what makes a colour system readable; minimality is what makes it a
 * puzzle.
 *
 * What it costs is green in more than one place in the same cell. Two of those
 * were real collisions and are handled: "In LabOS" goes neutral wherever roles are
 * coloured, because in `tag` mode it sat directly beside a green `Investor` tag on
 * the same line. What remains is the score pill — `#d1fae5` at the head of a
 * high-scoring row, against the investor chip's much paler `#f0fdf4` in `fill`.
 * Different shapes, different weights, opposite ends of the cell; the first seam to
 * look at if `fill` starts feeling noisy, but not a collision.
 *
 * ── References ───────────────────────────────────────────────────────────────
 * Airtable's Role field and folk's Status column are the `fill` case: soft tint,
 * dark text of the same hue, one hue per value. Deel's people table is where
 * `tag` comes from — the person chip stays neutral and the colour lives in the
 * small line of type beside it, so a long column of people reads as people.
 * `border` is the midpoint neither reference actually uses, which is itself worth
 * knowing: outlined-only chips are rare in this class of tool, and the tab is
 * partly a check on whether that is taste or a reason.
 *
 * ── The three tabs ───────────────────────────────────────────────────────────
 * `tag` → `border` → `fill`, quiet to loud, all on the same rows. `tag` is the
 * proposal and loads first; the other two show how much further the idea can be
 * pushed before it stops being worth it.
 *
 * There is no `No colour` tab. The uncoloured table already exists one entry up
 * the list as `warm-intros-v2`, on the same components and the same rows, so a
 * tab for it would be a second door to a neighbour — and having it here made this
 * entry read as still deciding whether to colour at all. It isn't.
 *
 * `off` remains a real mode in `RoleColorMode` — it is the context default, and
 * therefore what every other surface in the app renders. It is simply not
 * something this page offers.
 *
 * Everything below the control bar is `WarmIntrosV2Prototype`, unmodified.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { Tabs } from '@/components/common/Tabs';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { PathProfileChip } from '@/components/page/investors/WarmIntrosV2Workspace/PathProfileChip';
import WarmIntrosV2Prototype from '../warm-intros-v2/WarmIntrosV2Prototype';
import { ROLE_LEGEND, ROLE_TINT_CLASS, RoleColorProvider, type RoleColorMode } from '../warm-intros-v2/RoleColor';
// The tint classes themselves live with the component that emits them, so the
// legend and the table are lit by literally the same rules.
import r from '../warm-intros-v2/PathRole.module.scss';
import s from './RoleColors.module.scss';

/**
 * The two coloured treatments. `off` is still a real mode — it is the context
 * default, and it is what every other surface renders — but it is no longer a tab
 * here: the uncoloured table already exists one entry up the list as
 * `warm-intros-v2`, on the same components and the same rows. A tab that
 * duplicates a neighbouring prototype is a tab that makes this one look
 * undecided.
 */
type PickableMode = Exclude<RoleColorMode, 'off'>;

const MODE_TABS: Array<{ value: PickableMode; label: string }> = [
  { value: 'tag', label: 'Tags only' },
  { value: 'border', label: 'Border' },
  { value: 'fill', label: 'Fill' },
];

const MODE_NOTE: Record<PickableMode, string> = {
  tag: 'Nodes stay exactly as they are; only the tag beneath takes the hue. The chain still reads as one row of people, and the colour lands on the word that already names the role. Investor keeps its tag here — nothing else is left to carry it.',
  border: 'The tag, plus the chip’s 1px edge — fill left white, so the chain keeps its even texture. Stroke is the design system’s own border colour, not a thickened one: the question this tab settles is whether that reads at chip scale.',
  fill: 'Tint, edge and name together. Easiest to scan down a column, and the loudest option — judge it against the score pill leading each row.',
};

/**
 * One legend swatch, showing the treatment the current mode actually applies —
 * not a fixed colour key.
 *
 * A legend that shows tinted chips while the table is in `tag` mode is teaching
 * the wrong thing, so this renders through the same classes `PathHop` and
 * `HopRoleCaption` use, out of the same stylesheet. If the tint changes, both
 * change together.
 *
 *   tag    → the role tag alone, in its hue, exactly as it appears under a node
 *   border → the outlined chip
 *   fill   → the tinted chip
 */
function LegendSwatch({ role, label, mode }: { role: string; label: string; mode: PickableMode }) {
  const hue = r[ROLE_TINT_CLASS[role] ?? ''];

  if (mode === 'tag') {
    return <span className={clsx(r.roleCaption, hue, r.roleCaptionTinted, s.legendTag)}>{label}</span>;
  }

  return (
    <span className={clsx(s.legendChip, hue, mode === 'fill' ? r.tintFill : r.tintBorder)}>
      <PathProfileChip name={label} profileUid={`legend-${role}`} imageUrl={getDefaultAvatar(label)} onOpen={() => {}} nonInteractive />
    </span>
  );
}

export default function WarmIntrosRoleColorsPrototype() {
  // Opens on `tag` — the proposal. `fill` is here to show how far the idea goes if
  // you want it louder; the baseline lives in `warm-intros-v2`.
  const [mode, setMode] = useState<PickableMode>('tag');

  return (
    <RoleColorProvider value={mode}>
      {/* Sticky, because the question is "does this hold up over 14 rows" and
          answering it means switching modes with rows still on screen. */}
      <div className={s.bar}>
        <div className={s.barInner}>
          <div className={s.barHead}>
            <div>
              <h1 className={s.title}>Role colour on the path nodes</h1>
              <p className={s.note}>{MODE_NOTE[mode]}</p>
            </div>
            <Tabs
              variant="pill"
              value={mode}
              onValueChange={(v) => setMode(v as PickableMode)}
              tabs={MODE_TABS}
              classes={{ root: s.tabs, tab: s.tab, label: s.tabLabel }}
            />
          </div>

          <div className={s.legend}>
            {ROLE_LEGEND.map((item) => (
              <span key={item.role} className={s.legendItem}>
                <LegendSwatch role={item.role} label={item.label} mode={mode} />
                <span className={s.legendNote}>{item.note}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <WarmIntrosV2Prototype />
    </RoleColorProvider>
  );
}
