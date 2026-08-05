'use client';

import type { ReactNode, Ref } from 'react';
import clsx from 'clsx';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { CoInvestmentCountBadge, PlBackingMark } from '@/components/page/investors/PlBackingMark/PlBackingMark';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { WarmIntrosV2InvestorSummary, WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';
import { ListMembershipTags } from './ListMembershipTags';
import { hasRoleCaption, PathHop } from './PathHop';
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
 * Below 640px the same DOM lays out as cards (WarmIntrosV2Table.module.scss `mobile-only`).
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
    <div className={clsx(s.tableWrap, s.mobileCards)} ref={scrollRootRef}>
      <table className={s.table} role="table">
        <thead role="rowgroup">
          <tr role="row">
            <th className={`${s.th} ${s.colInvestor}`} scope="col" role="columnheader">
              Investor
            </th>
            <th className={`${s.th} ${s.colPath}`} scope="col" role="columnheader">
              Path
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => {
            const investor = row.investor;
            const name = investor?.name?.trim() || row.targetProfileUid;
            const org = investor?.currentOrg?.trim();
            const title = investor?.currentTitle?.trim();
            const orgLine = [org, title].filter(Boolean).join(' · ');
            const count = pathCount(row);
            const avatarSrc = memberAvatarSrc(investor);
            const connector = row.bestConnector;
            const chain = parseWarmPathHopChain(row.hopChain);
            const hops = chain?.hops?.length ? chain.hops : null;
            const captionBand = hasRoleCaption(hops);

            const leadBadge = (
              <span className={clsx(s.proximityCell, s.joinGroup, s.proximityLead)}>
                {row.proximityCode ? <ProximityCodeBadge code={row.proximityCode} className={s.joinLeft} /> : null}
                <ScorePercentPill
                  scorePercent={row.scorePercent}
                  scoreBand={row.scoreBand}
                  className={row.proximityCode ? s.joinRight : undefined}
                />
              </span>
            );

            return (
              <tr
                key={row.uid}
                role="row"
                className={clsx(s.row, s.mobileCard)}
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
                <td className={`${s.td} ${s.cardIdentity}`} role="cell">
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
                    {investor?.plBacking ? (
                      <div className={s.plLine}>
                        <PlBackingMark backing={investor.plBacking} />
                        <CoInvestmentCountBadge count={investor.coInvestmentsCount ?? 0} />
                      </div>
                    ) : null}
                  </div>
                </td>

                <td className={`${s.td} ${s.cardRoute}`} role="cell">
                  <div className={clsx(s.pathCell, s.pathCellTight)}>
                    <div className={s.pathChain}>
                      {leadBadge}
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
                              <span
                                key={`${hop.role ?? 'hop'}-${hop.profileUid || hop.name}-${i}`}
                                className={s.pathHop}
                              >
                                {i > 0 ? <span className={s.pathArrow}>→</span> : null}
                                <PathHop
                                  role={hop.role}
                                  memberUid={isOrg ? null : hop.memberUid}
                                  teamUid={isOrg ? null : hop.teamUid}
                                  name={hopName}
                                  isLast={i === hops.length - 1}
                                >
                                  <PathProfileChip
                                    name={hopName}
                                    profileUid={hop.profileUid}
                                    imageUrl={hopImage}
                                    onOpen={onOpenProfileUid}
                                    nonInteractive={isOrg}
                                    memberUid={isOrg ? null : hop.memberUid}
                                    teamUid={isOrg ? null : hop.teamUid}
                                  />
                                </PathHop>
                              </span>
                            );
                          })
                        : (
                          <>
                            {connector ? (
                              <span className={s.pathHop}>
                                <PathHop role="pl_connector" memberUid={connector.memberUid} name={connector.name}>
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
                                </PathHop>
                              </span>
                            ) : (
                              <span className={s.muted}>—</span>
                            )}
                            {connector && investor ? <span className={s.pathArrow}>→</span> : null}
                            {investor ? (
                              <span className={s.pathHop}>
                                <PathHop role="investor" memberUid={investor.memberUid} name={investor.name} isLast>
                                  <PathProfileChip
                                    name={investor.name}
                                    profileUid={investor.profileUid}
                                    imageUrl={avatarSrc}
                                    onOpen={onOpenProfileUid}
                                    memberUid={investor.memberUid}
                                  />
                                </PathHop>
                              </span>
                            ) : null}
                          </>
                        )}
                    </div>
                    <button
                      type="button"
                      className={clsx(s.viewAllLink, captionBand && s.viewAllInCaptionBand)}
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
