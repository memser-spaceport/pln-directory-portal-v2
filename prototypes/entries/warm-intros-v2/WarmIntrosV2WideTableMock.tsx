'use client';

/**
 * The five-column variant — **Investor · Fund · Backed · Path · Score**.
 *
 * The compact fork answered "too many columns" by deleting them, which left the
 * table narrower than its container: at 1200px the two columns ran out of content
 * around 800px and the rest was empty. This variant answers the same complaint the
 * other way — it puts the facts back into columns and lets the table consume the
 * width the way a table is supposed to. The whitespace goes away as a side effect
 * of the columns actually being columns.
 *
 * What moves, relative to the compact fork:
 *   firm            → its own **Fund** column, out from under the name
 *   PL backing      → its own **Backed** column, out from under the name
 *   score %         → its own **Score** column, right-aligned
 *
 * Score right-aligned is the point of giving it a column: percentages are a
 * quantity, and a quantity is read down its last digit. Left-aligned in a mixed
 * cell it was a label; right-aligned in a column of its own it is a ranking you can
 * scan without reading.
 *
 * The pairing this used to cost — code beside score, one joined object — is no
 * longer a cost: the proximity code is gone from every prototype, so score is the
 * only path metric left and a column is simply where it belongs.
 *
 * Everything else — the chain, the role captions, the row and cell chrome — is the
 * same code the compact table uses (`PathChain`, production's
 * `WarmIntrosV2Table.module.scss`).
 */

import type { ReactNode, Ref } from 'react';
import { ArrowUpRightIcon } from '@/components/icons';
import type { WarmIntrosV2InvestorSummary, WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';
import { ScorePercentPill } from '@/components/page/investors/WarmIntrosV2Workspace/ScorePercentPill';
import { ListMembershipTags } from '@/components/page/investors/WarmIntrosV2Workspace/ListMembershipTags';
import s from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2Table.module.scss';
import c from './TableColumns.module.scss';
import w from './WideColumns.module.scss';
import { PathChain } from './PathChain';
import { PlHistoryLine } from './PlHistory';
import { plHistoryOf } from './mocks';

interface Props {
  rows: WarmIntrosV2PathListItem[];
  onOpenMasterProfile: (investor: WarmIntrosV2InvestorSummary) => void;
  onOpenProfileUid: (profileUid: string) => void;
  onViewAllPaths: (row: WarmIntrosV2PathListItem) => void;
  onRowClick?: (row: WarmIntrosV2PathListItem) => void;
  showListName?: boolean;
  scrollRootRef?: Ref<HTMLDivElement>;
  sentinelRef?: Ref<HTMLDivElement>;
  footer?: ReactNode;
}

function pathCount(row: WarmIntrosV2PathListItem): number {
  return (row.pathSummary?.alternateCount ?? 0) + 1;
}

export function WarmIntrosV2WideTableMock({
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
    // Same card fallback as the compact variant below 640px — five columns is
    // even less viable at 390px than two were.
    <div className={`${s.tableWrap} ${w.wideCards}`} ref={scrollRootRef}>
      <table className={`${s.table} ${w.table}`} role="table">
        <thead role="rowgroup">
          <tr role="row">
            <th className={`${s.th} ${w.colInvestor}`} scope="col" role="columnheader">
              Investor
            </th>
            <th className={`${s.th} ${w.colFund}`} scope="col" role="columnheader">
              Fund
            </th>
            <th className={`${s.th} ${w.colBacked}`} scope="col" role="columnheader">
              Backed
            </th>
            <th className={`${s.th} ${w.colPath}`} scope="col" role="columnheader">
              Path
            </th>
            {/* Right-aligned header too — a numeric column reads wrong with its
                label hanging off the left edge of the digits. */}
            <th className={`${s.th} ${w.colScore} ${w.scoreCell}`} scope="col" role="columnheader">
              Score
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
            const plHistory = plHistoryOf(row);

            return (
              <tr
                key={row.uid}
                role="row"
                className={`${s.row} ${w.wideCard}`}
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
                <td className={s.td} role="cell">
                  <div className={s.investorText}>
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
                      <span className={c.nameArrow} aria-hidden>
                        <ArrowUpRightIcon />
                      </span>
                      {showListName ? <ListMembershipTags fallbackTargetSet={row.targetSet} inline /> : null}
                    </div>
                    {/* Only the role stays under the name — the firm has a column
                        of its own now, so `firm · role` would print it twice. */}
                    {title ? <div className={s.subtle}>{title}</div> : null}
                  </div>
                </td>

                <td className={s.td} role="cell">
                  {org ? <span className={w.fund}>{org}</span> : <span className={`${s.muted} ${w.emptyMark}`}>—</span>}
                </td>

                <td className={s.td} role="cell">
                  {/* Same component as the compact variant's stacked line — one
                      treatment for one fact, wherever it sits.

                      The dash matters here in a way it didn't there: stacked under
                      a name, "no PL history" was simply an absent line. In a column
                      it is a gap in a grid, and a gap reads as data we failed to
                      load rather than a fact about the investor. */}
                  {plHistory.backing || plHistory.coInvestmentCount > 0 ? (
                    <PlHistoryLine backing={plHistory.backing} coInvestmentCount={plHistory.coInvestmentCount} />
                  ) : (
                    <span className={`${s.muted} ${w.emptyMark}`}>—</span>
                  )}
                </td>

                <td className={s.td} role="cell">
                  <div className={s.pathCell}>
                    <PathChain
                      row={row}
                      onOpenProfileUid={onOpenProfileUid}
                      /* Nothing leads the chain here any more. The code used to,
                         and the score has its own column — so the chain starts at
                         the cell's left edge, which is what a chain wants. */
                      /* Trailing the chain, as in the compact variant. This column
                         is 39% of the width and wraps routinely, which is an
                         argument *for* riding inside the chain: the link wraps with
                         the chips instead of anchoring to a left edge the chain's
                         last line no longer reaches. */
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

                <td className={`${s.td} ${w.scoreCell}`} role="cell">
                  <ScorePercentPill scorePercent={row.scorePercent} scoreBand={row.scoreBand} />
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
