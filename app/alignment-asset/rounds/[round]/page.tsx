import { notFound, redirect } from 'next/navigation';
import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRoundsRegistry } from '@/components/page/aligement-assets/rounds/data/past-rounds-registry';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getRoundStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import { IPastRoundData } from '@/components/page/aligement-assets/rounds/types/current-round.types';
import styles from './page.module.css';

interface PastRoundPageProps {
  params: Promise<{ round: string }>;
}

/** Pre-render the archived rounds (1-17) at build time; later rounds render on demand. */
export function generateStaticParams() {
  return Object.keys(pastRoundsRegistry).map((n) => ({ round: n }));
}

/**
 * Rounds without a hand-authored archive file (18+) are rendered entirely
 * from the rounds API. Hero copy and regions never vary by round (verified
 * against every archived round), so they're read from the current-round
 * data file rather than duplicated; the activity catalog and token/buyback
 * figures are not derivable (see rounds.service.ts) and fall back to the
 * same values every other derived round shows.
 */
function mapStatsToPastRoundData(stats: RoundStatsResponse): IPastRoundData {
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
      regionsUnlocked: currentRoundData.stats.regionsUnlocked,
      incentivizedActivities: stats.incentivizedActivities,
      totalPointsCollected: stats.totalPointsCollected.toLocaleString('en-US'),
      totalTokensDistributed: 'TBD',
      numberOfBuybacks: 0,
    },
    leaderboard: [],
  };
}

export default async function PastRoundPage({ params }: PastRoundPageProps) {
  const { round: roundParam } = await params;
  const roundNumber = parseInt(roundParam, 10);

  // Guard: not a valid integer
  if (isNaN(roundNumber) || roundNumber < 1) notFound();

  const staticData = pastRoundsRegistry[roundNumber];
  if (staticData) {
    return (
      <div className={styles.pastRound}>
        <PastRoundComponent pastRoundData={staticData} />
      </div>
    );
  }

  // No archive file for this round (18+): derive it from the rounds API.
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
