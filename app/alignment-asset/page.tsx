import CurrentRoundComponent from '@/components/page/aligement-assets/rounds/current-round-component';
import styles from './plaa.module.css';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getLeaderboard, mapEntries } from '@/services/plaa/leaderboard.service';
import { LeaderboardEntry } from '@/components/page/aligement-assets/rounds/types';

export default async function PlaaPage() {
  const roundNumber = currentRoundData.meta.roundNumber;
  const { data } = await getLeaderboard(roundNumber);

  const currentSnapshotData: LeaderboardEntry[] = data
    ? mapEntries(data.entries.filter((e) => e.type === 'CURRENT_SNAPSHOT'))
    : currentRoundData.leaderboard.currentSnapshotData;

  const cumulativeData: LeaderboardEntry[] = data
    ? mapEntries(data.entries.filter((e) => e.type === 'CUMULATIVE'))
    : currentRoundData.leaderboard.cumulativeData;

  return (
    <div className={styles.rounds}>
      <CurrentRoundComponent leaderboardData={{ currentSnapshotData, cumulativeData }} />
    </div>
  );
}
