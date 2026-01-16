import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound3Data } from '@/components/page/aligement-assets/rounds/data/round-3.data';
import styles from './page.module.css';

export default function PastRound3Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound3Data} />
    </div>
  );
}
