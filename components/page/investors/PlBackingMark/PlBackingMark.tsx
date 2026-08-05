'use client';

/**
 * The investor's existing relationship with PL, made visible. `plBacking` was a
 * filter-only fact — nothing rendered it — so the only way to learn an investor
 * backed Filecoin was to toggle the filter and see who survived. This renders it.
 *
 * Marker + plain words, not a pill — the shape Attio uses for connection strength.
 * Color is load-bearing everywhere else in these rows (green = directory member,
 * proximity owns green/yellow/red), so this keeps `HopRoleBadge`'s violet
 * (`#6d28d9`), which nothing else in the investor cell claims.
 *
 * One treatment reused on every surface (table row, drawer, Master Profile modal)
 * so the same fact never has two looks.
 */

import clsx from 'clsx';
import type { WarmIntrosV2PlBacking } from '@/services/investors/warm-intros-v2.types';
import s from './PlBackingMark.module.scss';

/** "Backed PL" / "Backed Filecoin" / "Backed PL + FIL" — "backer" alone loses the useful half. */
export function plBackingLabel(backing: WarmIntrosV2PlBacking | null | undefined): string | null {
  if (!backing) return null;
  const { backedProtocolLabs, backedFilecoin } = backing;
  if (backedProtocolLabs && backedFilecoin) return 'Backed PL + FIL';
  if (backedProtocolLabs) return 'Backed PL';
  if (backedFilecoin) return 'Backed Filecoin';
  return null;
}

interface Props {
  backing: WarmIntrosV2PlBacking | null | undefined;
  className?: string;
}

export function PlBackingMark({ backing, className }: Props) {
  const label = plBackingLabel(backing);
  if (!label) return null;

  // Whether the match is on the firm or the person changes how much to trust it,
  // so it rides in the tooltip rather than lengthening the line.
  const detail = [backing?.firmName, backing?.matchKind ? `matched on ${backing.matchKind}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <span className={clsx(s.mark, className)} title={detail || undefined}>
      <span className={s.marker} aria-hidden />
      <span className={s.backing}>{label}</span>
    </span>
  );
}

/** Co-investment count — a bare digit, since the mark/heading beside it already supplies the antecedent. */
export function CoInvestmentCountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={clsx(s.count, className)} title={`${count} co-investment${count === 1 ? '' : 's'} with PL`}>
      {count}
    </span>
  );
}
