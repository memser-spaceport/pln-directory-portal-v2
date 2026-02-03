import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound12Data } from '@/components/page/aligement-assets/rounds/data/round-12.data';
import styles from './page.module.css';

export default function PastRound12Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound12Data} />
    </div>
  );
}
