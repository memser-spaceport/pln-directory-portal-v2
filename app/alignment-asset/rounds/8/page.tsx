import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound8Data } from '@/components/page/aligement-assets/rounds/data/round-8.data';
import styles from './page.module.css';

export default function PastRound8Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound8Data} />
    </div>
  );
}
