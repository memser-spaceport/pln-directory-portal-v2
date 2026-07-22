'use client';

import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { SectorTagsList } from '@/components/page/investors/SectorTagsList/SectorTagsList';
import type { SectorTag } from '@/services/investors/types';
import type { WarmIntrosV2InvestorSummary, WarmIntrosV2PathListItem } from '@/services/investors/warm-intros-v2.types';
import { ScorePercentPill } from './ScorePercentPill';
import s from './WarmIntrosV2Table.module.scss';

interface Props {
  rows: WarmIntrosV2PathListItem[];
  onOpenMasterProfile: (investor: WarmIntrosV2InvestorSummary) => void;
  onViewAllPaths: (row: WarmIntrosV2PathListItem) => void;
  onRowClick?: (row: WarmIntrosV2PathListItem) => void;
}

const PATH_PREVIEW_MAX = 80;

function pathPreview(row: WarmIntrosV2PathListItem): string {
  const connector = row.bestConnector?.name?.trim();
  const investor = row.investor?.name?.trim();
  if (connector && investor) return `${connector} → ${investor}`;

  const explanation = row.pathSummary?.explanation?.trim();
  if (!explanation) return '—';
  if (explanation.length <= PATH_PREVIEW_MAX) return explanation;
  return `${explanation.slice(0, PATH_PREVIEW_MAX - 1)}…`;
}

function pathCount(row: WarmIntrosV2PathListItem): number {
  return (row.pathSummary?.alternateCount ?? 0) + 1;
}

/**
 * Warm Intros v2 results table (S3-T4).
 * Name → MasterProfile modal (S3-T6); View all / row click → investor drawer (S3-T5).
 */
export function WarmIntrosV2Table({ rows, onOpenMasterProfile, onViewAllPaths, onRowClick }: Props) {
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
            const preview = pathPreview(row);

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
                    <div className={s.pathPreview} title={preview}>
                      {preview}
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
