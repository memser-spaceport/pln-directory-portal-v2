import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound16Data } from '@/components/page/aligement-assets/rounds/data/round-16.data';
import styles from './page.module.css';

export default function PastRound16Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound16Data} />
    </div>
  );
}
