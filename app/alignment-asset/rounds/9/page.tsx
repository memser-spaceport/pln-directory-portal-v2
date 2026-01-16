import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound9Data } from '@/components/page/aligement-assets/rounds/data/round-9.data';
import styles from './page.module.css';

export default function PastRound9Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound9Data} />
    </div>
  );
}
