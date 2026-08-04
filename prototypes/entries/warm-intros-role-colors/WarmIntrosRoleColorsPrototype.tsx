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
 * What it costs is green in three weights in one cell — the score pill, this chip,
 * and "In LabOS". Different shapes at different scales, and the chip's `#f0fdf4`
 * is much paler than the pill's `#d1fae5`, so they separate. Still the first seam
 * to look at if `fill` starts feeling noisy.
 *
 * ── References ───────────────────────────────────────────────────────────────
 * Airtable's Role field and folk's Status column are the `fill` case: soft tint,
 * dark text of the same hue, one hue per value. Deel's people table is where
 * `tag` comes from — the person chip stays neutral and the colour lives in the
 * small line of type beside it, so a long column of people reads as people.
 *
 * ── Two tabs, not three ──────────────────────────────────────────────────────
 * There was a `No colour` tab. It went: the uncoloured table already exists one
 * entry up the list, as `warm-intros-v2`, on the same components and the same
 * rows — so the tab was a second door to a neighbour, and having it here made
 * this entry read as still deciding whether to colour at all. It isn't. `tag` is
 * the proposal and loads first; `fill` shows how far the idea goes.
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
  { value: 'fill', label: 'Fill' },
];

const MODE_NOTE: Record<PickableMode, string> = {
  tag: 'Nodes stay exactly as they are; only the tag beneath takes the hue. The chain still reads as one row of people, and the colour lands on the word that already names the role. Investor keeps its tag here — nothing else is left to carry it.',
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
 *   tag  → the role tag alone, in its hue, exactly as it appears under a node
 *   fill → the tinted chip
 */
function LegendSwatch({ role, label, mode }: { role: string; label: string; mode: PickableMode }) {
  const hue = r[ROLE_TINT_CLASS[role] ?? ''];

  if (mode === 'tag') {
    return <span className={clsx(r.roleCaption, hue, r.roleCaptionTinted, s.legendTag)}>{label}</span>;
  }

  return (
    <span className={clsx(s.legendChip, hue, r.tintFill)}>
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
