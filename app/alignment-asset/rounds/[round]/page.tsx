import { notFound, redirect } from 'next/navigation';
import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRoundsRegistry } from '@/components/page/aligement-assets/rounds/data/past-rounds-registry';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getLeaderboard, mapEntries } from '@/services/plaa/leaderboard.service';
import { LeaderboardEntry } from '@/components/page/aligement-assets/rounds/types';
import styles from './page.module.css';

interface PastRoundPageProps {
  params: Promise<{ round: string }>;
}

/** Pre-render all known past round pages at build time. */
export function generateStaticParams() {
  return Object.keys(pastRoundsRegistry).map((n) => ({ round: n }));
}

export default async function PastRoundPage({ params }: PastRoundPageProps) {
  const { round: roundParam } = await params;
  const roundNumber = parseInt(roundParam, 10);

  // Guard: not a valid integer
  if (isNaN(roundNumber) || roundNumber < 1) notFound();

  // Guard: pointing at the current round → redirect to the canonical current-round URL
  if (roundNumber === currentRoundData.meta.roundNumber) {
    redirect('/alignment-asset');
  }

  const pastRoundData = pastRoundsRegistry[roundNumber];
  if (!pastRoundData) notFound();

  const { data } = await getLeaderboard(roundNumber, 'CURRENT_SNAPSHOT');

  const leaderboardEntries: LeaderboardEntry[] = data
    ? mapEntries(data.entries)
    : pastRoundData.leaderboard;

  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRoundData} leaderboardEntries={leaderboardEntries} />
    </div>
  );
}
