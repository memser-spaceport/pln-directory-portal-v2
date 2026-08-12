import { notFound, redirect } from 'next/navigation';
import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getRoundStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import { IPastRoundData } from '@/components/page/aligement-assets/rounds/types/current-round.types';
import styles from './page.module.css';

interface PastRoundPageProps {
  params: Promise<{ round: string }>;
}

/**
 * Every past round is rendered entirely from the rounds API — no more
 * round-N.data.ts file per round. Hero copy never varies by round (verified
 * against all 18 archived rounds), so it's read from the current-round data
 * file, which is the one piece of editorial content that's genuinely
 * round-independent.
 */
function mapStatsToPastRoundData(stats: RoundStatsResponse): IPastRoundData {
  // Simulation rows (rounds 7 and 9) carry a complete buyback record in
  // Airtable but were test runs, not real auctions — they stay out of the
  // user-facing buyback experience entirely. Only rounds 11 and 18 are live.
  // Note this deliberately does not gate stats.totalTokensDistributed below:
  // that figure is a per-round emission every round has, and simply happens
  // to be stored on the same Airtable table.
  const hasSettledBuyback =
    stats.buyback !== null && stats.buyback.totalBuybackPool !== null && !stats.buyback.simulation;

  return {
    meta: {
      roundId: stats.roundId,
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
      // Counts live auctions only. The original data counted any buyback
      // event as 1, so rounds 7 and 9 used to show 1 here off the back of
      // their simulations; with simulations removed they now show 0.
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

  // Guard: not a valid integer
  if (isNaN(roundNumber) || roundNumber < 1) notFound();

  const { data: stats } = await getRoundStats(roundNumber);
  if (!stats) notFound();

  // Pointing at the live current round → redirect to the canonical current-round URL
  if (stats.isCurrentRound) redirect('/alignment-asset');

  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={mapStatsToPastRoundData(stats)} />
    </div>
  );
}
