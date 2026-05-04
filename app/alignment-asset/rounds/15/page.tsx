import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound15Data } from '@/components/page/aligement-assets/rounds/data/round-15.data';
import styles from './page.module.css';

export default function PastRound15Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound15Data} />
    </div>
  );
}
