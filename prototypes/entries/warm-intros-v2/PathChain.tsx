'use client';

/**
 * The hop chain itself, lifted out of `WarmIntrosV2TableMock` so the two table
 * variants share one implementation rather than two that drift.
 *
 * Nothing here is new — it is the same rendering, moved: `parseWarmPathHopChain`
 * for the real chain, the connector → investor pair as the fallback when a row
 * has no `hopChain`, and `PathHop` labelling every hop but the last.
 *
 * The proximity badge is deliberately *not* included. The compact table leads the
 * cell with it; the wide table gives score its own column and leaves only the code
 * here. That difference is the whole point of having two variants, so it stays
 * with the caller.
 */

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';
import { PathProfileChip } from '@/components/page/investors/WarmIntrosV2Workspace/PathProfileChip';
import {
  parseWarmPathHopChain,
  type WarmPathV2HopNode,
} from '@/components/page/investors/WarmIntrosV2Workspace/parseWarmPathHopChain';
import s from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2Table.module.scss';
import { PathHop } from './PathRole';
// Press + focus states the chips don't ship — see ChipPress.module.scss.
import press from './ChipPress.module.scss';

/** The parsed hops, or null when the row falls back to connector → investor. */
export function chainHopsOf(row: WarmIntrosV2PathListItem): WarmPathV2HopNode[] | null {
  const chain = parseWarmPathHopChain(row.hopChain);
  return chain?.hops?.length ? chain.hops : null;
}

/**
 * `hasRoleCaption` lived here to tell the table whether a row had a caption band
 * for `View all` to tuck into. `View all` trails the chain now and tucks into
 * nothing, so the question has no asker.
 */

export function investorAvatarSrc(row: WarmIntrosV2PathListItem): string | null {
  const investor = row.investor;
  if (!investor?.memberUid) return null;
  return investor.imageUrl?.trim() || getDefaultAvatar(investor.name);
}

interface Props {
  row: WarmIntrosV2PathListItem;
  onOpenProfileUid: (profileUid: string) => void;
  /** Rendered before the first hop — the compact table puts the score % here. */
  lead?: React.ReactNode;
  /**
   * Rendered after the last hop, inside the chain's own flex row — `View all`
   * lives here rather than on a line of its own beneath the cell.
   *
   * It used to sit below, tucked up into the role captions' band, which worked
   * only while a ~95px proximity badge led the row and left an empty corner under
   * itself. Dropping the code shrank the lead to a ~40px pill and the link began
   * colliding with the first hop's caption; un-tucking it fixed the collision but
   * spent a whole line on one 11px link.
   *
   * At the end of the chain it costs no line at all, and it reads in the order you
   * think it: this route, then "…and 2 more". `.pathChain` already wraps, so on a
   * narrow cell it simply falls to the next line with the chips instead of being
   * pinned under them.
   */
  trail?: React.ReactNode;
  className?: string;
}

export function PathChain({ row, onOpenProfileUid, lead, trail, className }: Props) {
  const investor = row.investor;
  const name = investor?.name?.trim() || row.targetProfileUid;
  const connector = row.bestConnector;
  const avatarSrc = investorAvatarSrc(row);
  const hops = chainHopsOf(row);

  return (
    <div className={`${s.pathChain} ${press.chipPress}${className ? ` ${className}` : ''}`}>
      {lead}
      {hops
        ? hops.map((hop, i) => {
            const isOrg = hop.role === 'pl_org' || !hop.profileUid;
            const hopName =
              hop.name && hop.name !== hop.profileUid
                ? hop.name
                : hop.profileUid === connector?.profileUid
                  ? connector.name
                  : hop.profileUid === investor?.profileUid
                    ? name
                    : hop.name;
            const hopImage = isOrg
              ? null
              : hop.role === 'investor'
                ? avatarSrc
                : hop.memberUid
                  ? hop.imageUrl?.trim() || getDefaultAvatar(hopName)
                  : (hop.imageUrl ??
                    (connector?.profileUid === hop.profileUid
                      ? connector.memberUid
                        ? connector.imageUrl?.trim() || getDefaultAvatar(connector.name)
                        : connector.imageUrl
                      : null));
            return (
              <span key={`${hop.role ?? 'hop'}-${hop.profileUid || hop.name}-${i}`} className={s.pathHop}>
                {i > 0 ? <span className={s.pathArrow}>→</span> : null}
                {/* Every hop is labelled except the last — that one is the row's
                    own investor. A path can start at a founder, so hop 0's role
                    is read, never assumed. */}
                <PathHop role={hop.role} profileUid={hop.profileUid} isLast={i === hops.length - 1}>
                  <PathProfileChip
                    name={hopName}
                    profileUid={hop.profileUid}
                    imageUrl={hopImage}
                    onOpen={onOpenProfileUid}
                    nonInteractive={isOrg}
                    memberUid={isOrg ? null : hop.memberUid}
                  />
                </PathHop>
              </span>
            );
          })
        : (
            <>
              {connector ? (
                <span className={s.pathHop}>
                  <PathProfileChip
                    name={connector.name}
                    profileUid={connector.profileUid}
                    imageUrl={
                      connector.memberUid
                        ? connector.imageUrl?.trim() || getDefaultAvatar(connector.name)
                        : connector.imageUrl
                    }
                    onOpen={onOpenProfileUid}
                    memberUid={connector.memberUid}
                  />
                </span>
              ) : (
                <span className={s.muted}>—</span>
              )}
              {connector && investor ? <span className={s.pathArrow}>→</span> : null}
              {investor ? (
                <span className={s.pathHop}>
                  <PathProfileChip
                    name={investor.name}
                    profileUid={investor.profileUid}
                    imageUrl={avatarSrc}
                    onOpen={onOpenProfileUid}
                    memberUid={investor.memberUid}
                  />
                </span>
              ) : null}
            </>
          )}
      {trail}
    </div>
  );
}
