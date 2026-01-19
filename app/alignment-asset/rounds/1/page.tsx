import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound1Data } from '@/components/page/aligement-assets/rounds/data/round-1.data';
import styles from './page.module.css';

export default function PastRound1Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound1Data} />
    </div>
  );
}
