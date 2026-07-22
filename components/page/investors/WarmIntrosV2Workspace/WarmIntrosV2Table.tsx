'use client';

import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { SectorTagsList } from '@/components/page/investors/SectorTagsList/SectorTagsList';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { SectorTag } from '@/services/investors/types';
import type { WarmIntrosV2InvestorSummary, WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';
import Image from 'next/image';
import { PathProfileChip } from './PathProfileChip';
import { ScorePercentPill } from './ScorePercentPill';
import s from './WarmIntrosV2Table.module.scss';

interface Props {
  rows: WarmIntrosV2PathListItem[];
  onOpenMasterProfile: (investor: WarmIntrosV2InvestorSummary) => void;
  onOpenProfileUid: (profileUid: string) => void;
  onViewAllPaths: (row: WarmIntrosV2PathListItem) => void;
  onRowClick?: (row: WarmIntrosV2PathListItem) => void;
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
export function WarmIntrosV2Table({ rows, onOpenMasterProfile, onOpenProfileUid, onViewAllPaths, onRowClick }: Props) {
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th className={`${s.th} ${s.colInvestor}`} scope="col">
              Investor
            </th>
            <th className={`${s.th} ${s.colTeam}`} scope="col">
              Team
            </th>
            <th className={`${s.th} ${s.colSector}`} scope="col">
              Industry / Sector
            </th>
            <th className={`${s.th} ${s.colProximity}`} scope="col">
              Proximity
            </th>
            <th className={`${s.th} ${s.colPath}`} scope="col">
              Path
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const investor = row.investor;
            const name = investor?.name?.trim() || row.targetProfileUid;
            const org = investor?.currentOrg?.trim();
            const title = investor?.currentTitle?.trim();
            const sectors = (investor?.sectors ?? []) as SectorTag[];
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
                  <div className={s.investorCell}>
                    {avatarSrc ? (
                      <Image className={s.investorAvatar} src={avatarSrc} alt="" width={32} height={32} unoptimized />
                    ) : null}
                    <div className={s.investorText}>
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
                      {investor?.email ? <div className={s.subtle}>{investor.email}</div> : null}
                    </div>
                  </div>
                </td>

                <td className={s.td}>
                  <div className={s.teamCell}>{org || <span className={s.muted}>—</span>}</div>
                  {title ? <div className={s.subtle}>{title}</div> : null}
                </td>

                <td className={s.td}>
                  <SectorTagsList tags={sectors} max={3} />
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

                <td className={s.td}>
                  <div className={s.pathCell}>
                    <div className={s.pathChain}>
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
