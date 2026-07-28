'use client';

/**
 * Fork of production `WarmIntrosV2Table` with the **Team** and **Industry / Sector**
 * columns removed, and Path moved ahead of Proximity — Investor · Path · Proximity.
 *
 * Everything else is a verbatim transcription and still uses the production
 * `WarmIntrosV2Table.module.scss`. The only local CSS is the re-balanced column
 * widths (see `TableColumns.module.scss`), because the production widths were
 * apportioned across five columns.
 *
 * Firm + role no longer have a column of their own, so they ride along under the
 * investor name where the email already sits — dropping the column shouldn't lose
 * the data. Sectors are gone from the row entirely; they remain in the drawer.
 */

import type { ReactNode, Ref } from 'react';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { WarmIntrosV2InvestorSummary, WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';
import { PathProfileChip } from '@/components/page/investors/WarmIntrosV2Workspace/PathProfileChip';
import { ScorePercentPill } from '@/components/page/investors/WarmIntrosV2Workspace/ScorePercentPill';
import s from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2Table.module.scss';
// The MasterProfile modal already colours the two lists — Neuro blue, Gold amber.
// Reusing those pills keeps one colour language for "which list" across surfaces.
import p from '@/components/page/investors/WarmIntrosV2Workspace/MasterProfileModal.module.scss';
import c from './TableColumns.module.scss';
import { TARGET_SET_SHORT_LABEL } from './mocks';

interface Props {
  rows: WarmIntrosV2PathListItem[];
  onOpenMasterProfile: (investor: WarmIntrosV2InvestorSummary) => void;
  onOpenProfileUid: (profileUid: string) => void;
  onViewAllPaths: (row: WarmIntrosV2PathListItem) => void;
  onRowClick?: (row: WarmIntrosV2PathListItem) => void;
  /**
   * Show which list each row came from. Only worth it when the scope spans more
   * than one list — under a single list every badge would say the same thing.
   */
  showListName?: boolean;
  scrollRootRef?: Ref<HTMLDivElement>;
  sentinelRef?: Ref<HTMLDivElement>;
  footer?: ReactNode;
}

const LIST_FULL_LABEL: Record<string, string> = {
  'neuro-fund-i': 'Neuro Fund I LP Pipeline',
  'gold-co-investors': 'Gold PLC Co-Investors',
};

function ListBadge({ targetSet }: { targetSet: string }) {
  const short = TARGET_SET_SHORT_LABEL[targetSet as keyof typeof TARGET_SET_SHORT_LABEL];
  if (!short) return null;
  const tone = targetSet === 'neuro-fund-i' ? p.listNeuro : targetSet === 'gold-co-investors' ? p.listGold : undefined;
  return (
    <span className={`${p.listPill} ${tone ?? ''} ${c.listBadge}`} title={LIST_FULL_LABEL[targetSet] ?? short}>
      {short}
    </span>
  );
}

function pathCount(row: WarmIntrosV2PathListItem): number {
  return (row.pathSummary?.alternateCount ?? 0) + 1;
}

function memberAvatarSrc(investor: WarmIntrosV2InvestorSummary | undefined): string | null {
  if (!investor?.memberUid) return null;
  return investor.imageUrl?.trim() || getDefaultAvatar(investor.name);
}

export function WarmIntrosV2TableMock({
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
      <table className={`${s.table} ${c.table}`}>
        <thead>
          <tr>
            <th className={`${s.th} ${c.colInvestor}`} scope="col">
              Investor
            </th>
            <th className={`${s.th} ${c.colPath}`} scope="col">
              Path
            </th>
            <th className={`${s.th} ${c.colProximity}`} scope="col">
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
            const count = pathCount(row);
            const avatarSrc = memberAvatarSrc(investor);
            const connector = row.bestConnector;
            // Firm · role, folded into the investor cell now that Team has no column.
            const orgLine = [org, title].filter(Boolean).join(' · ');

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
                    <div className={c.nameLine}>
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
                      {showListName ? <ListBadge targetSet={row.targetSet} /> : null}
                    </div>
                    {orgLine ? <div className={s.subtle}>{orgLine}</div> : null}
                    {investor?.email ? <div className={s.subtle}>{investor.email}</div> : null}
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
