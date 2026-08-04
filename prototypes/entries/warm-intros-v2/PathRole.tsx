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

export function HopRoleCaption({ role }: { role?: string | null }) {
  const label = roleLabel(role);
  if (!label) return null;
  return <span className={s.roleCaption}>{label}</span>;
}

/**
 * One hop: the chip, plus its role caption. `isLast` suppresses the caption on
 * the final hop — that one is the investor the row is about, and saying so again
 * at the end of every chain is the only label position really does give you.
 */
export function PathHop({
  role,
  isLast = false,
  children,
}: {
  role?: string | null;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  const showRole = !isLast && !!roleLabel(role);
  return (
    <span className={clsx(s.hop, showRole && s.hopWithRole)}>
      {children}
      {showRole ? <HopRoleCaption role={role} /> : null}
    </span>
  );
}
