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
 * The cost, stated plainly: the proximity code and the score were joined into one
 * object in the compact fork *because* they describe the same path — caliber and
 * band, one shape. Giving score a column breaks that pairing. The code stays with
 * the chain it describes; the score becomes scannable. Which trade is right depends
 * on whether you are reading one row or ranking fourteen, which is exactly what
 * having both variants is for.
 *
 * Everything else — the chain, the role captions, the row and cell chrome — is the
 * same code the compact table uses (`PathChain`, production's
 * `WarmIntrosV2Table.module.scss`).
 */

import type { ReactNode, Ref } from 'react';
import { ArrowUpRightIcon } from '@/components/icons';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
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
                  {/* Production's own 6px cell gap, not the compact variant's 0 +
                      caption-band pull. That pull assumes the chain is one line and
                      the caption is the last thing in the cell; at 39% of the width
                      this column wraps routinely, and on a wrapped chain the pull
                      lands `View all` on a row of chips. Same reason it is switched
                      off in the compact variant's mobile block. */}
                  <div className={s.pathCell}>
                    <PathChain
                      row={row}
                      onOpenProfileUid={onOpenProfileUid}
                      lead={
                        /* The code alone here, not the joined code+% object: the
                           score has a column now. The code still leads, because it
                           still describes this chain. */
                        row.proximityCode ? (
                          <span className={w.codeLead}>
                            <ProximityCodeBadge code={row.proximityCode} />
                          </span>
                        ) : null
                      }
                    />
                    <button
                      type="button"
                      className={`${s.viewAllLink} ${c.viewAllQuiet}`}
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
