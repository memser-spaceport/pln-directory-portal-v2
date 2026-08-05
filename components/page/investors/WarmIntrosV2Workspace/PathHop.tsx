'use client';

/**
 * Role + LabOS caption line under a path hop chip, and the wrapper that reserves
 * space for it. Replaces `HopRoleBadge`'s bordered pill: only the last hop's role
 * badge was genuinely redundant (it always restates the row's own investor) — every
 * other position is real information, since a path doesn't have to start at a PL
 * member. What changes is weight, not presence: the label drops its pill chrome and
 * becomes a caption under the chip, the shape a role that appears on every row uses
 * elsewhere.
 */

import Link from 'next/link';
import clsx from 'clsx';
import { ROLE_LABEL } from './HopRoleBadge';
import { resolveHopLabOs } from './parseWarmPathHopChain';
import s from './PathHop.module.scss';

export function roleLabel(role?: string | null): string | null {
  if (!role || role === 'pl_org') return null;
  return ROLE_LABEL[role] ?? role.replace(/_/g, ' ');
}

interface HopRoleCaptionProps {
  role?: string | null;
  memberUid?: string | null;
  teamUid?: string | null;
  name: string;
}

/**
 * The caption line: the hop's role, and whether they're reachable in LabOS.
 *
 * No second dot here — `PathProfileChip` already wears one for exactly this fact,
 * and a second green dot beside a 10px muted role caption would be noise, not
 * signal. The LabOS segment is a real link to the profile, so it carries the
 * browser's own link affordance (underline) plus weight — a non-color signal,
 * since the caption's color alone can't be the only thing distinguishing it.
 */
export function HopRoleCaption({ role, memberUid, teamUid, name }: HopRoleCaptionProps) {
  const label = roleLabel(role);
  const labOs = resolveHopLabOs({ memberUid, teamUid, name });
  if (!label && !labOs) return null;

  return (
    <span className={s.roleCaption}>
      {label}
      {label && labOs ? ' · ' : null}
      {labOs ? (
        <Link
          href={labOs.type === 'member' ? `/members/${labOs.uid}` : `/teams/${labOs.uid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={s.labOs}
          title={`${labOs.name} — open in LabOS`}
          onClick={(e) => e.stopPropagation()}
        >
          In LabOS
        </Link>
      ) : null}
    </span>
  );
}

interface PathHopProps {
  role?: string | null;
  memberUid?: string | null;
  teamUid?: string | null;
  name: string;
  /** Suppresses the role label (not the LabOS link) — that hop is the row's own investor. */
  isLast?: boolean;
  children: React.ReactNode;
}

/** One hop: the chip, plus its role/LabOS caption. */
export function PathHop({ role, memberUid, teamUid, name, isLast = false, children }: PathHopProps) {
  const showRole = !isLast && !!roleLabel(role);
  const labOs = resolveHopLabOs({ memberUid, teamUid, name });
  const showCaption = showRole || !!labOs;

  return (
    <span className={clsx(s.hop, showCaption && s.hopWithRole)}>
      {children}
      {showCaption ? (
        <HopRoleCaption role={showRole ? role : null} memberUid={memberUid} teamUid={teamUid} name={name} />
      ) : null}
    </span>
  );
}

/**
 * Whether a chain hangs a role/LabOS caption below itself — the only thing a
 * "View all" link below the chain has to visually clear. Used to decide whether
 * the link needs pulling up into the caption's own line, or a two-hop fallback
 * with no caption band needs no adjustment.
 */
export function hasRoleCaption(
  hops: Array<{ role?: string | null; memberUid?: string | null; teamUid?: string | null; name: string }> | null,
): boolean {
  if (!hops) return false;
  return hops.some(
    (hop, i) =>
      // LabOS can caption the last hop too, where the role never does.
      (i !== hops.length - 1 && !!roleLabel(hop.role)) ||
      !!resolveHopLabOs({ memberUid: hop.memberUid, teamUid: hop.teamUid, name: hop.name }),
  );
}
