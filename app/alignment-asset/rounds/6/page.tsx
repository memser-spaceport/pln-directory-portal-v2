import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound6Data } from '@/components/page/aligement-assets/rounds/data/round-6.data';
import styles from './page.module.css';

export default function PastRound6Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound6Data} />
    </div>
  );
}
