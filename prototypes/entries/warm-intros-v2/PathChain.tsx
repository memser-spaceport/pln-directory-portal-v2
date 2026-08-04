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
import { PathHop, roleLabel } from './PathRole';
// Press + focus states the chips don't ship — see ChipPress.module.scss.
import press from './ChipPress.module.scss';

/** The parsed hops, or null when the row falls back to connector → investor. */
export function chainHopsOf(row: WarmIntrosV2PathListItem): WarmPathV2HopNode[] | null {
  const chain = parseWarmPathHopChain(row.hopChain);
  return chain?.hops?.length ? chain.hops : null;
}

/**
 * Whether the chain hangs a role caption below itself — the only thing
 * `View all` has to clear. Rows on the two-chip fallback have no caption band.
 */
export function hasRoleCaption(hops: WarmPathV2HopNode[] | null): boolean {
  return !!hops && hops.some((hop, i) => i !== hops.length - 1 && !!roleLabel(hop.role));
}

export function investorAvatarSrc(row: WarmIntrosV2PathListItem): string | null {
  const investor = row.investor;
  if (!investor?.memberUid) return null;
  return investor.imageUrl?.trim() || getDefaultAvatar(investor.name);
}

interface Props {
  row: WarmIntrosV2PathListItem;
  onOpenProfileUid: (profileUid: string) => void;
  /** Rendered before the first hop — the compact table puts proximity here. */
  lead?: React.ReactNode;
  className?: string;
}

export function PathChain({ row, onOpenProfileUid, lead, className }: Props) {
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
                <PathHop role={hop.role} isLast={i === hops.length - 1}>
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
    </div>
  );
}
