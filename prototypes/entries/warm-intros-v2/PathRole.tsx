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
 */

import clsx from 'clsx';
import { labOsOf } from './mocks';
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
  const label = roleLabel(role);
  const labOs = labOsOf(profileUid);
  if (!label && !labOs) return null;

  return (
    <span className={s.roleCaption}>
      {label}
      {label && labOs ? ' · ' : null}
      {/* One wording for both profile types. `LabOsBadge` splits them into
          "In LabOS" / "Fund in LabOS", but the caption is answering "can I reach
          them here", and the answer is the same either way — whether the profile
          happens to be a person or their fund is a detail of the record, not of
          the reachability. The name still rides in the tooltip. */}
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
  // The role is suppressed on the last hop, but LabOS is not: that one is the
  // investor the row is about, and whether *they* are reachable in LabOS is the
  // most useful thing on the chain, not the least.
  const showRole = !isLast && !!roleLabel(role);
  const labOs = labOsOf(profileUid);
  const showCaption = showRole || !!labOs;

  return (
    <span className={clsx(s.hop, showCaption && s.hopWithRole)}>
      {children}
      {showCaption ? <HopRoleCaption role={showRole ? role : null} profileUid={profileUid} /> : null}
    </span>
  );
}
