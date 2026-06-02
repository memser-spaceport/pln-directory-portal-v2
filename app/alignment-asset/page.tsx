import CurrentRoundComponent from '@/components/page/aligement-assets/rounds/current-round-component';
import styles from './plaa.module.css';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getLeaderboard } from '@/services/plaa/leaderboard.service';

export default async function PlaaPage() {
  const roundNumber = currentRoundData.meta.roundNumber;
  const { data: leaderboardResponse } = await getLeaderboard(roundNumber);

  return (
    <div className={styles.rounds}>
      <CurrentRoundComponent leaderboardResponse={leaderboardResponse} />
    </div>
  );
}
