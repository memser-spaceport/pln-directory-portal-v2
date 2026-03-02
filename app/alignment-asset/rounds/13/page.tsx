import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound13Data } from '@/components/page/aligement-assets/rounds/data/round-13.data';
import styles from './page.module.css';

export default function PastRound13Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound13Data} />
    </div>
  );
}
