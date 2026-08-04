'use client';

/**
 * Role on a path hop, reduced to the part that carries information.
 *
 * Dev renders `HopRoleBadge` after every chip. Only one of those is genuinely
 * redundant: the **last** hop is the row's own investor by definition, so
 * labelling it restates the subject of the row.
 *
 * Every other position is real information. A path does *not* have to start at a
 * PL member — `Founder → Investor` is a shape the backend emits, and production's
 * drawer builds alternates as exactly that. `role` is a free-form string on the
 * payload with nothing constraining hop 0, so it gets read, never inferred.
 *
 * What does change is the weight: the label drops its pill chrome and becomes a
 * caption under the name, the shape Workable / Aboard / Peerlist use for a role
 * that appears on every row.
 *
 * No colour system here on purpose. Proximity already colour-codes by caliber,
 * and a second palette competing with the load-bearing one is how the column got
 * noisy in the first place.
 *
 * That stays true of the shipped tab. `RoleColorProvider` (see `RoleColor.tsx`)
 * can flip it on for the `warm-intros-role-colors` entry, which exists to put the
 * claim in front of real rows rather than argue it — the mode defaults to `off`,
 * so nothing here changes unless a provider says otherwise.
 */

import clsx from 'clsx';
import { labOsOf } from './mocks';
import { ROLE_TINT_CLASS, useRoleColorMode, type RoleColorMode } from './RoleColor';
import s from './PathRole.module.scss';

const ROLE_LABEL: Record<string, string> = {
  pl_connector: 'PL Member',
  founder: 'Founder',
  co_investor: 'Co-investor',
  investor: 'Investor',
};

export function roleLabel(role?: string | null): string | null {
  if (!role || role === 'pl_org') return null;
  return ROLE_LABEL[role] ?? role.replace(/_/g, ' ');
}

/**
 * The hue class for the **chip**, which only `fill` ever tints.
 *
 * `tag` deliberately returns nothing here: the whole point of that mode is that
 * the nodes stay one uniform object and the colour lands on the tag beneath. The
 * hue still reaches the tag, which carries its own copy of the class — see
 * `HopRoleCaption`.
 *
 * Two classes, not one: the hue lives on `.tintPl` / `.tintFounder` / … as CSS
 * custom properties, and `.tintFill` decides how much of that hue gets spent. So
 * adding a third treatment later touches one block, not four.
 */
function chipTintClass(mode: RoleColorMode, role?: string | null): string | undefined {
  if (mode !== 'fill' || !role) return undefined;
  // Every hop, including the last. The `isLast` rule stays where it belongs — on
  // the *label*, which is a word that restates the row — and does not extend to
  // the tint.
  //
  // It briefly did. The argument was that a hue in the same position on every row
  // is decoration rather than information, which is true of the hue *as a signal*
  // and beside the point as a *convention*: `MasterProfileModal` tags an investor
  // green, so a reader who has opened one profile already knows what green means,
  // and a grey chip where they expect green is a question rather than a saving.
  // A colour system earns its keep by being total, not by being minimal.
  const hue = s[ROLE_TINT_CLASS[role] ?? ''];
  if (!hue) return undefined;
  return clsx(hue, s.tintFill);
}

/**
 * The caption line: the hop's role, and whether they are in LabOS.
 *
 * Wording is `LabOsBadge`'s own — "In LabOS" for a member profile, "Fund in LabOS"
 * for a team — so the two surfaces call the same thing the same name. What is not
 * borrowed is its chip: that is `#ecfdf5` at 11px/600, which next to a 10px muted
 * role caption would make the sub-line louder than the person's name above it.
 * Here it is words on the caption row, carrying only LabOS's green.
 *
 * No second dot, deliberately. The chip above already wears a green dot for
 * "Directory member", and a second green dot 20px away meaning something adjacent
 * but different is worse than no marker at all.
 */
export function HopRoleCaption({ role, profileUid }: { role?: string | null; profileUid?: string | null }) {
  const mode = useRoleColorMode();
  const label = roleLabel(role);
  const labOs = labOsOf(profileUid);
  if (!label && !labOs) return null;

  // The tag is where colour costs least and reads most: full words, on their own
  // line, no chrome to fight. In `tag` mode it is the only thing carrying the
  // hue, which is why that mode leans on the tag being a *word* — "Founder" in
  // orange still says Founder to anyone who never learns the palette.
  const tinted = mode !== 'off' && !!role ? s[ROLE_TINT_CLASS[role] ?? ''] : undefined;

  return (
    <span className={clsx(s.roleCaption, tinted, tinted && s.roleCaptionTinted)}>
      {label}
      {label && labOs ? ' · ' : null}
      {/* One wording for both profile types. `LabOsBadge` splits them into
          "In LabOS" / "Fund in LabOS", but the caption is answering "can I reach
          them here", and the answer is the same either way — whether the profile
          happens to be a person or their fund is a detail of the record, not of
          the reachability. The name still rides in the tooltip. */}
      {/* Keeps its green in every mode. It briefly did not: while the roles took
          `HopRoleBadge`'s palette, Founder was green too, and two greens 20px
          apart meaning different things is worse than one going quiet. On the
          MasterProfile palette founder is orange and the only green role is the
          investor, which the chain never tints — so green is LabOS's again, and
          the Directory dot's, and nothing else's. */}
      {labOs ? (
        <span className={s.labOs} title={`${labOs.name} — open in LabOS`}>
          In LabOS
        </span>
      ) : null}
    </span>
  );
}

/**
 * One hop: the chip, plus its role caption. `isLast` suppresses the caption on
 * the final hop — that one is the investor the row is about, and saying so again
 * at the end of every chain is the only label position really does give you.
 */
export function PathHop({
  role,
  profileUid,
  isLast = false,
  children,
}: {
  role?: string | null;
  profileUid?: string | null;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  const mode = useRoleColorMode();
  // The role is suppressed on the last hop, but LabOS is not: that one is the
  // investor the row is about, and whether *they* are reachable in LabOS is the
  // most useful thing on the chain, not the least.
  //
  // `tag` mode is the exception, and it has to be. There the tag is the *only*
  // thing carrying a hue, so suppressing the last one would leave Investor as the
  // single role with no colour — in the mode whose entire subject is colouring
  // roles. The word does restate the row, as it always did; in this mode that is
  // the cost of the mode rather than an oversight, and it is the honest thing to
  // put in front of someone choosing between the three.
  const showRole = (mode === 'tag' || !isLast) && !!roleLabel(role);
  const labOs = labOsOf(profileUid);
  const showCaption = showRole || !!labOs;

  return (
    // The chip tint reads `role` directly, not `showRole` — in `fill` the last hop
    // loses its tag but is still an investor, and the chip says so in the same
    // green the profile it opens does.
    <span className={clsx(s.hop, showCaption && s.hopWithRole, chipTintClass(mode, role))}>
      {children}
      {showCaption ? <HopRoleCaption role={showRole ? role : null} profileUid={profileUid} /> : null}
    </span>
  );
}
