'use client';

/**
 * The investor's existing relationship with PL, made visible.
 *
 * Dev added `plBacking` as a *filter* only — nothing in the table, drawer or
 * profile ever shows it, so the sole way to learn an investor backed Filecoin is
 * to toggle the chip and see who survives. This renders the fact, which turns
 * the toggle into an ordinary filter over something you can already see.
 *
 * Rendered as a marker plus plain words — the shape Attio uses for connection
 * strength. It was a filled pill until the email line came out of the cell; with
 * only two lines left, a pill made a secondary fact the loudest thing after the
 * name.
 *
 * Colour is still load-bearing everywhere else in this row — green is "directory
 * member", indigo and amber are *which list*, and proximity owns the
 * green/yellow/red bands — so this keeps `HopRoleBadge`'s violet (`#6d28d9`),
 * which nothing else in the investor cell claims. Amber would have collided with
 * the Gold PLC badge two lines up.
 */

import clsx from 'clsx';
import type { MasterProfileDetail } from '@/services/investors/warm-intros-v2.types';
// The drawer's own count chip — same number, same object, both surfaces.
import d from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2InvestorDrawer.module.scss';
import s from './PlHistory.module.scss';

type PlBacking = MasterProfileDetail['plBacking'];

/** Says which of the two it is — "backer" alone loses the useful half. */
export function plBackingLabel(backing: PlBacking): string | null {
  if (!backing) return null;
  const { backedProtocolLabs, backedFilecoin } = backing;
  if (backedProtocolLabs && backedFilecoin) return 'Backed PL + FIL';
  if (backedProtocolLabs) return 'Backed PL';
  if (backedFilecoin) return 'Backed Filecoin';
  return null;
}

/**
 * Marker + words, one treatment used on every surface. A pill here was the
 * loudest thing in the row once the email line went, and having a pill in the
 * table but plain text in the drawer would be two looks for one fact.
 */
interface Props {
  backing: PlBacking;
  coInvestmentCount: number;
}

export function PlBackingMark({ backing, className }: { backing: PlBacking; className?: string }) {
  const label = plBackingLabel(backing);
  if (!label) return null;

  // Whether the match is on the firm or the person changes how much to trust it,
  // so it rides along as the tooltip rather than lengthening the line.
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

/**
 * Co-investment count — the drawer's `.count` verbatim, so the same number is the
 * same object on both surfaces. The digit stands alone as it does there; the
 * tooltip carries what it counts.
 */
export function CoInvestmentCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className={d.count} title={`${count} co-investment${count === 1 ? '' : 's'} with PL`}>
      {count}
    </span>
  );
}

/**
 * The PL relationship on one line: marker, a statement, then the count.
 *
 * The count sits here rather than up on the name line so the whole relationship
 * reads as one thought. It keeps the same shape whether or not there is backing —
 * without a statement in front of it the chip would be a digit with no antecedent.
 */
export function PlHistoryLine({ backing, coInvestmentCount }: Props) {
  const label = plBackingLabel(backing);
  if (!label && coInvestmentCount === 0) return null;

  return (
    <div className={s.line}>
      {label ? (
        <PlBackingMark backing={backing} />
      ) : (
        <span className={s.mark}>
          <span className={s.marker} aria-hidden />
          <span className={s.backing}>Co-invested with PL</span>
        </span>
      )}
      <CoInvestmentCountBadge count={coInvestmentCount} />
    </div>
  );
}
