'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Scales,
  ArrowRight,
  ArrowLineDown,
  Tag,
  Gavel,
  Money,
  Question,
  Lifebuoy,
  CaretDown,
} from '@phosphor-icons/react';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import { useScrollDepthTracking } from '@/hooks/useScrollDepthTracking';
import { SUPPORT_EMAIL } from '@/constants/plaa';
import type { KpiWeightEntry } from '@/services/plaa/kpi-weights.service';
import type { RoundStatsResponse } from '@/services/plaa/rounds.service';
import type { TrustHoldingsData } from '@/services/plaa/trust-holdings.service';
import OverviewTopline from './overview-topline';
import SnapshotRoundPicker, { RoundChangeMethod } from './snapshot-round-picker';
import styles from './overview.module.scss';
import type { CSSProperties } from 'react';

const cssVars = (vars: Record<string, string>) => vars as CSSProperties;

const KPI_WEIGHTS_FALLBACK: KpiWeightEntry[] = [
  { category: 'Knowledge Sharing', weight: null, percentOfTotal: 22.58, emissionsPerSnapshot: 2258 },
  { category: 'Projects', weight: null, percentOfTotal: 20.97, emissionsPerSnapshot: 2097 },
  { category: 'Network Tooling', weight: null, percentOfTotal: 19.35, emissionsPerSnapshot: 1935 },
  { category: 'Programs', weight: null, percentOfTotal: 18.55, emissionsPerSnapshot: 1855 },
  { category: 'People/Talent', weight: null, percentOfTotal: 14.52, emissionsPerSnapshot: 1452 },
  { category: 'Brand', weight: null, percentOfTotal: 4.03, emissionsPerSnapshot: 403 },
];

const MONTHLY_POOL = 10_000;
const EXAMPLE_MY_POINTS = 100;
const EXAMPLE_CATEGORY_POINTS = 1_000;

const REDEEM_STEPS = [
  { title: 'Place a bid', description: 'Submit PLAA in a buyback auction.', icon: <Tag size={27} weight="regular" /> },
  { title: 'Auction clears', description: 'Accepted bids are determined.', icon: <Gavel size={27} weight="regular" /> },
  {
    title: 'Receive proceeds',
    description: 'Accepted bids will be redeemed for cash.',
    icon: <Money size={27} weight="regular" />,
  },
];

interface CategoryStat {
  name: string;
  points: number;
  plaa: number;
}

const CATEGORY_STATS_FALLBACK: CategoryStat[] = KPI_WEIGHTS_FALLBACK.map((row) => ({
  name: row.category,
  points: (row.emissionsPerSnapshot ?? 0) * 6,
  plaa: row.emissionsPerSnapshot ?? 0,
}));

export interface RoundHistoryEntry {
  roundNumber: number;
  label: string;
  categories: CategoryStat[];
}

export interface ActiveMemberOverviewProps {
  kpiWeights?: KpiWeightEntry[];
  roundStats?: RoundStatsResponse;
  trustHoldings?: TrustHoldingsData;
  roundHistory?: RoundHistoryEntry[];
}

export default function ActiveMemberOverview({
  kpiWeights,
  roundStats,
  trustHoldings,
  roundHistory = [],
}: ActiveMemberOverviewProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedRoundNumber, setSelectedRoundNumber] = useState(roundStats?.roundNumber);
  const { onOverviewActivitiesLinkClicked, onOverviewFaqLinkClicked, onOverviewSnapshotRoundChanged } =
    useAlignmentAssetsAnalytics();
  useScrollDepthTracking('overview');

  const currentRoundNumber = roundStats?.roundNumber;
  const selectedRound = roundHistory.find((round) => round.roundNumber === selectedRoundNumber);
  const isCurrentRoundSelected = selectedRoundNumber !== undefined && selectedRoundNumber === currentRoundNumber;

  const kpiRows = kpiWeights && kpiWeights.length > 0 ? kpiWeights : KPI_WEIGHTS_FALLBACK;

  const categoryStats = useMemo<CategoryStat[]>(() => {
    // Only pillars in the emissions schedule get a spoke. The API also returns pillars that exist only in
    // the token tables (e.g. Capital), which would otherwise show as an empty spoke.
    const scheduled = new Set(kpiRows.map((row) => row.category));
    const inSchedule = (stats: CategoryStat[]) => stats.filter((stat) => scheduled.has(stat.name));
    // History rounds share one category list across every round, so the chart keeps its shape while browsing.
    if (selectedRound) return inSchedule(selectedRound.categories);
    const points = roundStats?.chart ?? [];
    const plaa = roundStats?.tokenChart ?? [];
    const names = new Set<string>([...points.map((p) => p.name), ...plaa.map((p) => p.name)]);
    if (names.size === 0) return CATEGORY_STATS_FALLBACK;
    return inSchedule(
      Array.from(names)
        .sort()
        .map((name) => ({
          name,
          points: points.find((p) => p.name === name)?.value ?? 0,
          plaa: plaa.find((p) => p.name === name)?.value ?? 0,
        })),
    );
  }, [kpiRows, roundStats, selectedRound]);

  // The worked conversion example uses a real row from the schedule above, so its numbers always match it.
  const exampleRow =
    kpiRows.find((row) => row.category === 'Network Tooling' && row.percentOfTotal != null) ??
    kpiRows.find((row) => row.percentOfTotal != null) ??
    KPI_WEIGHTS_FALLBACK[2];
  const examplePercent = exampleRow.percentOfTotal ?? 0;
  const examplePool = exampleRow.emissionsPerSnapshot ?? Math.round((MONTHLY_POOL * examplePercent) / 100);
  const exampleShare = EXAMPLE_MY_POINTS / EXAMPLE_CATEGORY_POINTS;
  const examplePlaa = Math.floor(examplePool * exampleShare);

  // Mid-snapshot, points are in but PLAA hasn't converted yet.
  const isConversionPending = isCurrentRoundSelected && categoryStats.every((c) => c.plaa === 0);

  const maxPoints = Math.max(1, ...categoryStats.map((c) => c.points));
  const maxPlaa = Math.max(1, ...categoryStats.map((c) => c.plaa));

  const historyCategoryNames = useMemo(() => {
    // Same rule as the radar: only pillars in the emissions schedule get a column.
    const scheduled = new Set(kpiRows.map((row) => row.category));
    const names = new Set<string>();
    roundHistory.forEach((round) => round.categories.forEach((c) => names.add(c.name)));
    return Array.from(names)
      .filter((name) => scheduled.has(name))
      .sort();
  }, [kpiRows, roundHistory]);

  const handleActivitiesClick = () => onOverviewActivitiesLinkClicked('/alignment-asset/activities', 'cta-banner');
  const handleFaqClick = () => onOverviewFaqLinkClicked('/alignment-asset/faqs');
  const handleRoundChange = (roundNumber: number, method: RoundChangeMethod) => {
    onOverviewSnapshotRoundChanged(selectedRoundNumber, roundNumber, method);
    setSelectedRoundNumber(roundNumber);
  };

  return (
    <div className={styles.wrapper}>
      <OverviewTopline trustHoldings={trustHoldings} />

      <div className={styles.section}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>Snapshots &amp; Points</h2>
          <p className={styles.sectionDesc}>
            Each monthly snapshot period, a pool of 10,000 PLAA is available to reward verified Incentivized Activities.
            Each category has a fixed allocation, and your points as a share of that category’s total decide how much
            converts to you.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.snapshotHeader}>
            <div>
              <div className={styles.snapshotHeaderTitle}>Points and PLAA collected by category</div>
              <div className={styles.snapshotHeaderDesc}>
                {selectedRound
                  ? `Round ${selectedRound.roundNumber} — ${selectedRound.label}`
                  : roundStats
                    ? `Round ${roundStats.roundNumber} — ${roundStats.month} ${roundStats.year}`
                    : 'Illustrative example, not a specific snapshot'}
              </div>
              {isConversionPending && (
                <div className={styles.snapshotHeaderNote}>
                  In progress. Points convert to PLAA at the end of the snapshot period.
                </div>
              )}
            </div>
            <div className={styles.snapshotHeaderControls}>
              {roundHistory.length > 1 && selectedRoundNumber !== undefined && (
                <SnapshotRoundPicker
                  rounds={roundHistory}
                  selectedRound={selectedRoundNumber}
                  currentRound={currentRoundNumber}
                  onChange={handleRoundChange}
                />
              )}
              <div className={styles.legendRow}>
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={cssVars({ '--ov-dot': '#0a9952' })} />
                  Points collected
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={cssVars({ '--ov-dot': '#1b4dff' })} />
                  PLAA distributed
                </span>
              </div>
            </div>
          </div>

          <div className={styles.chartGrid}>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={categoryStats} outerRadius="72%">
                  <PolarGrid stroke="var(--ov-border-subtle)" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#45546c' }} />
                  <Radar
                    name="Points collected"
                    dataKey="points"
                    stroke="#0a9952"
                    fill="rgba(10,153,82,0.12)"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={{ r: 3.5, fill: '#0a9952' }}
                  />
                  <Radar
                    name="PLAA distributed"
                    dataKey="plaa"
                    stroke="#1b4dff"
                    fill="rgba(27,77,255,0.14)"
                    strokeWidth={2}
                    dot={{ r: 3.5, fill: '#1b4dff' }}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.categoryList}>
              <div className={styles.categoryListHead}>
                <span>Category</span>
                <span>PLAA distributed</span>
              </div>
              {categoryStats.map((row) => (
                <div key={row.name} className={styles.categoryRow}>
                  <div className={styles.categoryRowHead}>
                    <span className={styles.categoryName}>{row.name}</span>
                    <span className={styles.categoryPlaaValue}>
                      {row.plaa.toLocaleString()} <span className={styles.categoryPlaaUnit}>PLAA</span>
                    </span>
                  </div>
                  <div className={styles.categoryBars}>
                    <div className={styles.categoryBarTrack}>
                      <div
                        className={styles.categoryBarFill}
                        style={{ width: `${(row.points / maxPoints) * 100}%`, ...cssVars({ '--ov-bar': '#0a9952' }) }}
                      />
                    </div>
                    <div className={styles.categoryBarTrack}>
                      <div
                        className={styles.categoryBarFill}
                        style={{ width: `${(row.plaa / maxPlaa) * 100}%`, ...cssVars({ '--ov-bar': '#1b4dff' }) }}
                      />
                    </div>
                  </div>
                  <div className={styles.categoryPoints}>{row.points.toLocaleString()} points</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.callout}>
            <Scales size={18} weight="fill" className={styles.calloutIcon} />
            <div className={styles.calloutText}>
              When more people contribute in the same category, the PLAA pool is more widely distributed; when activity
              is lower in a category, more PLAA is available per contributor.
            </div>
          </div>

          <div className={styles.historySection}>
            <button
              type="button"
              className={styles.historyToggle}
              onClick={() => setIsHistoryOpen((open) => !open)}
              aria-expanded={isHistoryOpen}
            >
              <span className={styles.snapshotHeaderTitle}>Snapshot history</span>
              <CaretDown
                size={16}
                weight="bold"
                className={isHistoryOpen ? styles.historyChevronOpen : styles.historyChevron}
              />
            </button>
            {isHistoryOpen && (
              <div className={styles.historyBody}>
                {historyCategoryNames.length === 0 ? (
                  <div className={styles.historyEmpty}>No snapshot history available yet.</div>
                ) : (
                  <div className={styles.historyTableWrap}>
                    <table className={styles.historyTable}>
                      <thead>
                        <tr>
                          <th className={styles.historySnapshotHeadCell}>Snapshot</th>
                          {historyCategoryNames.map((name) => (
                            <th key={name} className={styles.historyTableHeadCell}>
                              {name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {roundHistory.map((round) => (
                          <tr key={round.roundNumber}>
                            <td className={styles.historySnapshotCell}>{round.label}</td>
                            {historyCategoryNames.map((name) => {
                              const stat = round.categories.find((c) => c.name === name);
                              return (
                                <td key={name} className={styles.historyDataCell}>
                                  <div className={styles.historyConversion}>
                                    <span className={styles.historyConversionPoints}>
                                      {(stat?.points ?? 0).toLocaleString()} pts
                                    </span>
                                    <span className={styles.historyConversionArrow}>↓</span>
                                    <span className={styles.historyConversionPlaa}>
                                      {(stat?.plaa ?? 0).toLocaleString()} PLAA
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.kpiSection}>
            <div className={styles.snapshotHeaderTitle}>KPI emissions schedule</div>
            <div className={styles.snapshotHeaderDesc}>
              Each category receives a fixed portion of monthly PLAA, and allocations change as network needs evolve.
            </div>
            <div className={styles.kpiTableWrap}>
              <table className={styles.kpiTable}>
                <thead>
                  <tr>
                    <th className={styles.kpiTableHeadCell}>KPI Category</th>
                    <th className={styles.kpiTableHeadCell}>% of Total Emissions</th>
                    <th className={styles.kpiTableHeadCell}>Emission per Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiRows.map((row) => (
                    <tr key={row.category}>
                      <td className={styles.kpiTableCell}>{row.category}</td>
                      <td className={styles.kpiTableCell}>
                        {row.percentOfTotal != null ? `${row.percentOfTotal.toFixed(2)}%` : '—'}
                      </td>
                      <td className={styles.kpiTableCell}>
                        {row.emissionsPerSnapshot != null ? row.emissionsPerSnapshot.toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>Points → PLAA Conversion</h2>
          <p className={styles.sectionDesc}>
            Points convert at the end of each monthly snapshot period, using a predefined formula tied to the KPI
            emissions schedule.
          </p>
        </div>

        <div>
          <div className={styles.conversionLabel}>The conversion happens in three steps</div>
          <div className={styles.conversionSubtext}>
            Traced through one example: {exampleRow.category}, where I collected {EXAMPLE_MY_POINTS.toLocaleString()} of
            the category’s {EXAMPLE_CATEGORY_POINTS.toLocaleString()} points.
          </div>

          <div className={styles.conversionGrid}>
            <div className={styles.conversionStep}>
              <div className={styles.conversionStepHeader}>
                <span className={styles.conversionStepBadge} style={cssVars({ '--ov-accent': '#1b4dff' })}>
                  1
                </span>
                <div className={styles.conversionStepTitle}>Category allocation</div>
              </div>
              <div className={styles.conversionStepDesc}>Set by the category’s share of the emissions schedule.</div>
              <div className={styles.formulaBox}>
                <div className={styles.formulaRow}>
                  <span>monthly pool</span>
                  <span>{MONTHLY_POOL.toLocaleString()}</span>
                </div>
                <div className={styles.formulaRow}>
                  <span>× category allocation</span>
                  <span>{examplePercent.toFixed(2)}%</span>
                </div>
                <div className={styles.formulaResult}>
                  <span className={styles.formulaResultValue} style={cssVars({ '--ov-accent': '#1b4dff' })}>
                    {examplePool.toLocaleString()} PLAA
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.conversionArrow}>
              <ArrowRight size={18} weight="bold" />
            </div>

            <div className={styles.conversionStep}>
              <div className={styles.conversionStepHeader}>
                <span className={styles.conversionStepBadge} style={cssVars({ '--ov-accent': '#0e6e9e' })}>
                  2
                </span>
                <div className={styles.conversionStepTitle}>My proportion</div>
              </div>
              <div className={styles.conversionStepDesc}>My share of the category’s points.</div>
              <div
                className={styles.formulaBox}
                style={cssVars({
                  '--ov-formula-bg': 'rgba(14,110,158,0.06)',
                  '--ov-formula-border': 'rgba(14,110,158,0.3)',
                })}
              >
                <div className={styles.formulaRow}>
                  <span>my points</span>
                  <span>{EXAMPLE_MY_POINTS.toLocaleString()}</span>
                </div>
                <div className={styles.formulaRow}>
                  <span style={{ whiteSpace: 'nowrap' }}>÷ points collected in category</span>
                  <span>{EXAMPLE_CATEGORY_POINTS.toLocaleString()}</span>
                </div>
                <div className={styles.formulaResult}>
                  <span className={styles.formulaResultValue} style={cssVars({ '--ov-accent': '#0e6e9e' })}>
                    {exampleShare * 100}%
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.conversionArrow}>
              <ArrowRight size={18} weight="bold" />
            </div>

            <div className={styles.conversionStep}>
              <div className={styles.conversionStepHeader}>
                <span className={styles.conversionStepBadge} style={cssVars({ '--ov-accent': '#0b7a6d' })}>
                  3
                </span>
                <div className={styles.conversionStepTitle}>PLAA distribution</div>
              </div>
              <div className={styles.conversionStepDesc}>That share of the category allocation, rounded down.</div>
              <div
                className={styles.formulaBox}
                style={cssVars({
                  '--ov-formula-bg': 'rgba(11,122,109,0.06)',
                  '--ov-formula-border': 'rgba(11,122,109,0.3)',
                })}
              >
                <div className={styles.formulaRow}>
                  <span>category pool</span>
                  <span>{examplePool.toLocaleString()}</span>
                </div>
                <div className={styles.formulaRow}>
                  <span>× my proportion</span>
                  <span>{exampleShare * 100}%</span>
                </div>
                <div className={styles.formulaResult}>
                  <span className={styles.formulaResultValue} style={cssVars({ '--ov-accent': '#0b7a6d' })}>
                    {examplePlaa.toLocaleString()} PLAA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.callout}>
          <ArrowLineDown size={18} weight="fill" className={styles.calloutIcon} />
          <div className={styles.calloutText}>
            <strong>Only whole PLAA are issued.</strong> Calculated amounts are rounded down to the nearest whole PLAA,
            applied consistently to all participants. If your points don’t add up to at least one PLAA in a category,
            you won’t collect PLAA that snapshot period.
            <span className={styles.disclaimerSmall}>
              The points you collect are not guaranteed to convert into PLAA and may never result in any value. The
              points are a way of measuring the activities that you are doing in the network. Additionally, unless you
              sign the applicable PLAA documentation, you may not receive any PLAA. Any PLAA that are issued may be
              settled through the PLAA settlement process.
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>Redeeming PLAA</h2>
          <p className={styles.sectionDesc}>
            PLAA is redeemed through periodic buyback auctions run by the Trust. Bids are collected as a batch, settled
            at a single clearing price, and paid out in cash.
          </p>
        </div>

        <div className={styles.redeemCard}>
          <div className={styles.stepGridWrap}>
            <div className={styles.stepConnector} />
            <div className={styles.stepGrid}>
              {REDEEM_STEPS.map((step) => (
                <div key={step.title} className={styles.stepItem}>
                  <span className={styles.stepIcon}>{step.icon}</span>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDesc}>{step.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.redeemFaqRow}>
            <Question size={18} weight="regular" className={styles.redeemFaqIcon} />
            <div className={styles.redeemFaqText}>
              For details on eligibility, auctions, and settlement, see the{' '}
              <Link href="/alignment-asset/faqs" onClick={handleFaqClick}>
                FAQ
              </Link>
              .
            </div>
          </div>
        </div>
      </div>

      <div className={styles.ctaBanner}>
        <div className={styles.ctaBannerText}>
          <h2 className={styles.ctaBannerTitle}>Collect points this snapshot.</h2>
          <p className={styles.ctaBannerDesc}>
            Browse the incentivized activities open now and see what each one is worth.
          </p>
        </div>
        <Link href="/alignment-asset/activities" className={styles.ctaBannerButton} onClick={handleActivitiesClick}>
          View activities <ArrowRight size={16} weight="bold" />
        </Link>
      </div>

      <div className={styles.legalDisclaimer}>
        Nothing in these materials constitutes investment, financial, or legal advice. The clearing price established in
        any auction reflects the supply and demand among participating holders of PLAA and should not be construed as an
        appraisal, or fair market value determination of PLAA. Holders of PLAA should consult with their own financial,
        tax, and legal advisors before deciding whether to participate. The Alignment Asset is still in private beta,
        and we’re actively experimenting.
      </div>

      <div className={styles.footerNote}>
        <Lifebuoy size={18} weight="regular" />
        <span>
          Questions about points, conversion, or auctions? Check the{' '}
          <Link href="/alignment-asset/faqs" onClick={handleFaqClick}>
            FAQ
          </Link>{' '}
          or email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </span>
      </div>
    </div>
  );
}
