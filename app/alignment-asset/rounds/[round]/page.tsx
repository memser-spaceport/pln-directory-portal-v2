import { notFound, redirect } from 'next/navigation';
import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getCurrentRoundStats, getRoundStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import { IPastRoundData } from '@/components/page/aligement-assets/rounds/types/current-round.types';
import styles from './page.module.css';

interface PastRoundPageProps {
  params: Promise<{ round: string }>;
}

// Every past round renders from the rounds API; hero copy is read from the
// current-round data file since it never varies by round.
function mapStatsToPastRoundData(stats: RoundStatsResponse): IPastRoundData {
  // Simulation buybacks were test runs, not real auctions, and stay out of
  // the user-facing buyback experience. This doesn't gate totalTokensDistributed,
  // which is a per-round emission every round has regardless of buyback status.
  const hasSettledBuyback =
    stats.buyback !== null && stats.buyback.totalBuybackPool !== null && !stats.buyback.simulation;

  return {
    meta: {
      roundNumber: stats.roundNumber,
      isCurrentRound: stats.isCurrentRound,
      month: stats.month,
      year: stats.year,
      lastUpdated: stats.lastUpdated,
    },
    hero: currentRoundData.hero,
    stats: {
      onboardedParticipants: stats.onboardedParticipants,
      regionsUnlocked: stats.regionsUnlocked,
      incentivizedActivities: stats.incentivizedActivities,
      totalPointsCollected: stats.totalPointsCollected.toLocaleString('en-US'),
      totalTokensDistributed:
        stats.buyback?.totalTokensDistributed != null
          ? stats.buyback.totalTokensDistributed.toLocaleString('en-US')
          : 'TBD',
      numberOfBuybacks: hasSettledBuyback ? 1 : 0,
      ...(stats.labweek25IncentivizedActivities.length > 0
        ? { labweek25IncentivizedActivities: stats.labweek25IncentivizedActivities }
        : {}),
    },
    leaderboard: [],
  };
}

export default async function PastRoundPage({ params }: PastRoundPageProps) {
  const { round: roundParam } = await params;
  const roundNumber = parseInt(roundParam, 10);

  if (isNaN(roundNumber) || roundNumber < 1) notFound();

  const [{ data: stats }, { data: current }] = await Promise.all([
    getRoundStats(roundNumber),
    getCurrentRoundStats(),
  ]);
  if (!stats) notFound();

  if (stats.isCurrentRound) redirect('/alignment-asset');

  // Falls back to the round already being viewed if the live lookup fails.
  const currentRoundNumber = current?.roundNumber ?? stats.roundNumber;

  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={mapStatsToPastRoundData(stats)} currentRoundNumber={currentRoundNumber} />
    </div>
  );
}
