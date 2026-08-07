'use client';

/**
 * Fork of production `WarmIntrosV2Table`, down to two columns — **Investor** and
 * **Path**.
 *
 * Everything else is a verbatim transcription and still uses the production
 * `WarmIntrosV2Table.module.scss`; the local CSS is layout only (see
 * `TableColumns.module.scss`), because production's widths were apportioned
 * across five columns.
 *
 * What went, and where it went instead:
 *   Team, Industry / Sector  → dropped (sectors remain in the drawer)
 *   firm · role              → under the investor name
 *   email                    → drawer + CSV export only; nobody reads an address
 *                              at a glance, and it re-encoded the firm above it
 *   Proximity column         → the score % now *leads* the path cell, where it
 *                              describes the chain it sits on
 *   Proximity **code**       → dropped entirely. `PL+1A` / `F+2B` encode family +
 *                              hop count + caliber in five characters, all three
 *                              of which the row already says in plain sight: the
 *                              chain shows the family and the hop count by being
 *                              drawn, and caliber is what the % is a measure of.
 *                              It cost a glossary drawer to read one badge.
 */

import type { ReactNode, Ref } from 'react';
import { ArrowUpRightIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { WarmIntrosV2InvestorSummary, WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';
import { ScorePercentPill } from '@/components/page/investors/WarmIntrosV2Workspace/ScorePercentPill';
import s from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2Table.module.scss';
// Dev's own list chip — 11px, tighter than the 12px modal pill this used to
// borrow, and it already resolves the label from the target set.
import { ListMembershipTags } from '@/components/page/investors/WarmIntrosV2Workspace/ListMembershipTags';
import c from './TableColumns.module.scss';
// The chain rendering is shared with the wide variant — see PathChain.tsx.
import { PathChain } from './PathChain';
import { PlHistoryLine } from './PlHistory';
import { plHistoryOf } from './mocks';

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
    // Below 640px the same DOM lays out as cards — see `.mobileCards`. The
    // explicit roles are what keep it a table for assistive tech once the CSS
    // takes `display: table` away; browsers drop the implicit ones when it does.
    <div className={`${s.tableWrap} ${c.mobileCards}`} ref={scrollRootRef}>
      <table className={`${s.table} ${c.table}`} role="table">
        <thead role="rowgroup">
          <tr role="row">
            <th className={`${s.th} ${c.colInvestor}`} scope="col" role="columnheader">
              Investor
            </th>
            {/* Just "Path": the score % rides at the head of this cell, but it
                measures the path rather than being a second thing the column
                holds, so naming it in the header only made the header longer. */}
            <th className={`${s.th} ${c.colPath}`} scope="col" role="columnheader">
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
            const count = pathCount(row);
            // Firm · role, folded into the investor cell now that Team has no column.
            const orgLine = [org, title].filter(Boolean).join(' · ');
            const plHistory = plHistoryOf(row);

            return (
              <tr
                key={row.uid}
                role="row"
                className={`${s.row} ${c.mobileCard}`}
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
                <td className={`${s.td} ${c.cardIdentity}`} role="cell">
                  <div className={s.investorText}>
                    {/* `.nameLine` is production's own — this had a local copy of
                        it for no reason. */}
                    <div className={s.nameLine}>
                      <button
                        type="button"
                        className={`${s.nameBtn} ${c.nameNeutral}`}
                        aria-label={`Open profile for ${name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (investor) onOpenMasterProfile(investor);
                        }}
                      >
                        {name}
                      </button>
                      {/* Carries the "this opens something" signal that the blue
                          used to. `aria-hidden` because the button's own
                          aria-label already says it — the glyph is for the eye. */}
                      <span className={c.nameArrow} aria-hidden>
                        <ArrowUpRightIcon />
                      </span>
                      {/* No `PL Network` badge: this investor's own chip in the
                          Path column already carries the green Directory dot, so
                          the row was stating it twice — and its green was a
                          fourth colour competing inside one small cell. */}
                      {showListName ? <ListMembershipTags fallbackTargetSet={row.targetSet} inline /> : null}
                    </div>
                    {orgLine ? <div className={s.subtle}>{orgLine}</div> : null}
                    {/* Email dropped: nobody reads an address, they copy it — and
                        the copy button is in the drawer and the CSV export has it.
                        It also mostly re-encoded the firm on the line above. */}
                    {/* Relationship with PL, not identity — so it gets its own
                        line rather than a third pill up on the name row. */}
                    <PlHistoryLine backing={plHistory.backing} coInvestmentCount={plHistory.coInvestmentCount} />
                  </div>
                </td>

                <td className={`${s.td} ${c.cardRoute}`} role="cell">
                  <div className={`${s.pathCell} ${c.pathCellTight}`}>
                    <PathChain
                      row={row}
                      onOpenProfileUid={onOpenProfileUid}
                      lead={
                        /* Leads the cell, so its left edge is at the same x on
                           every row — the top-to-bottom scan a separate column
                           was buying is kept without spending a column on it. */
                        <span className={`${s.proximityCell} ${c.proximityLead}`}>
                          <ScorePercentPill scorePercent={row.scorePercent} scoreBand={row.scoreBand} />
                        </span>
                      }
                      /* Reads in the order you think it: this route, then "…and 2
                         more". Rides inside the chain rather than under it — see
                         PathChain's `trail`. */
                      trail={
                        <button
                          type="button"
                          className={`${s.viewAllLink} ${c.viewAllQuiet} ${c.viewAllTrail}`}
                          aria-label={`View all ${count} paths for ${name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewAllPaths(row);
                          }}
                        >
                          View all ({count})
                        </button>
                      }
                    />
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
