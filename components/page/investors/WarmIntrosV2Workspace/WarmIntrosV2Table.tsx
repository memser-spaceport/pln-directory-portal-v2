'use client';

import type { ReactNode, Ref } from 'react';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { WarmIntrosV2InvestorSummary, WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';
import { ListMembershipTags } from './ListMembershipTags';
import { PathProfileChip } from './PathProfileChip';
import { parseWarmPathHopChain } from './parseWarmPathHopChain';
import { ScorePercentPill } from './ScorePercentPill';
import s from './WarmIntrosV2Table.module.scss';

interface Props {
  rows: WarmIntrosV2PathListItem[];
  onOpenMasterProfile: (investor: WarmIntrosV2InvestorSummary) => void;
  onOpenProfileUid: (profileUid: string) => void;
  onViewAllPaths: (row: WarmIntrosV2PathListItem) => void;
  onRowClick?: (row: WarmIntrosV2PathListItem) => void;
  /** Show list badges beside the name — only when the scope spans more than one list. */
  showListName?: boolean;
  /** Scroll container for infinite-scroll IntersectionObserver root. */
  scrollRootRef?: Ref<HTMLDivElement>;
  /** Placed at the bottom of the scrollable table body. */
  sentinelRef?: Ref<HTMLDivElement>;
  footer?: ReactNode;
}

function pathCount(row: WarmIntrosV2PathListItem): number {
  return (row.pathSummary?.alternateCount ?? 0) + 1;
}

function memberAvatarSrc(investor: WarmIntrosV2InvestorSummary | undefined): string | null {
  if (!investor?.memberUid) return null;
  return investor.imageUrl?.trim() || getDefaultAvatar(investor.name);
}

/**
 * Warm Intros v2 results table.
 * Path column uses clickable PL connector / investor chips (same language as the drawer).
 */
export function WarmIntrosV2Table({
  rows,
  onOpenMasterProfile,
  onOpenProfileUid,
  onViewAllPaths,
  onRowClick,
  showListName = false,
  scrollRootRef,
  sentinelRef,
  footer,
}: Props) {
  return (
    <div className={s.tableWrap} ref={scrollRootRef}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={`${s.th} ${s.colInvestor}`} scope="col">
              Investor
            </th>
            <th className={`${s.th} ${s.colPath}`} scope="col">
              Path
            </th>
            <th className={`${s.th} ${s.colProximity}`} scope="col">
              Proximity
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const investor = row.investor;
            const name = investor?.name?.trim() || row.targetProfileUid;
            const org = investor?.currentOrg?.trim();
            const title = investor?.currentTitle?.trim();
            const orgLine = [org, title].filter(Boolean).join(' · ');
            const count = pathCount(row);
            const avatarSrc = memberAvatarSrc(investor);
            const connector = row.bestConnector;

            return (
              <tr
                key={row.uid}
                className={s.row}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                <td className={s.td}>
                  <div className={s.investorText}>
                    <div className={s.nameLine}>
                      <button
                        type="button"
                        className={s.nameBtn}
                        aria-label={`Open profile for ${name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (investor) onOpenMasterProfile(investor);
                        }}
                      >
                        {name}
                      </button>
                      {showListName ? (
                        <ListMembershipTags listSlugs={investor?.listSlugs} fallbackTargetSet={row.targetSet} inline />
                      ) : null}
                    </div>
                    {orgLine ? <div className={s.subtle}>{orgLine}</div> : null}
                    {investor?.email ? <div className={s.subtle}>{investor.email}</div> : null}
                  </div>
                </td>

                <td className={s.td}>
                  <div className={s.pathCell}>
                    <div className={s.pathChain}>
                      {(() => {
                        const chain = parseWarmPathHopChain(row.hopChain);
                        const hops = chain?.hops?.length ? chain.hops : null;
                        if (hops) {
                          return hops.map((hop, i) => {
                            const isOrg = hop.role === 'pl_org' || !hop.profileUid;
                            const hopImage = isOrg
                              ? null
                              : hop.role === 'investor'
                                ? avatarSrc
                                : hop.memberUid
                                  ? hop.imageUrl?.trim() || getDefaultAvatar(hop.name)
                                  : hop.imageUrl ??
                                    (connector?.profileUid === hop.profileUid
                                      ? connector.memberUid
                                        ? connector.imageUrl?.trim() || getDefaultAvatar(connector.name)
                                        : connector.imageUrl
                                      : null);
                            return (
                              <span key={`${hop.role ?? 'hop'}-${hop.profileUid || hop.name}-${i}`} className={s.pathHop}>
                                {i > 0 ? <span className={s.pathArrow}>→</span> : null}
                                <PathProfileChip
                                  name={hop.name}
                                  profileUid={hop.profileUid}
                                  imageUrl={hopImage}
                                  onOpen={onOpenProfileUid}
                                  nonInteractive={isOrg}
                                />
                              </span>
                            );
                          });
                        }
                        return (
                          <>
                            {connector ? (
                              <PathProfileChip
                                name={connector.name}
                                profileUid={connector.profileUid}
                                imageUrl={
                                  connector.memberUid
                                    ? connector.imageUrl?.trim() || getDefaultAvatar(connector.name)
                                    : connector.imageUrl
                                }
                                onOpen={onOpenProfileUid}
                              />
                            ) : (
                              <span className={s.muted}>—</span>
                            )}
                            {connector && investor ? <span className={s.pathArrow}>→</span> : null}
                            {investor ? (
                              <PathProfileChip
                                name={investor.name}
                                profileUid={investor.profileUid}
                                imageUrl={avatarSrc}
                                onOpen={onOpenProfileUid}
                              />
                            ) : null}
                          </>
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      className={s.viewAllLink}
                      aria-label={`View all ${count} paths for ${name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewAllPaths(row);
                      }}
                    >
                      View all ({count})
                    </button>
                  </div>
                </td>

                <td className={s.td}>
                  <div className={s.proximityCell}>
                    {row.proximityCode ? (
                      <ProximityCodeBadge code={row.proximityCode} />
                    ) : (
                      <span className={s.muted}>—</span>
                    )}
                    <ScorePercentPill scorePercent={row.scorePercent} scoreBand={row.scoreBand} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div ref={sentinelRef} className={s.sentinel} />
      {footer}
    </div>
  );
}
