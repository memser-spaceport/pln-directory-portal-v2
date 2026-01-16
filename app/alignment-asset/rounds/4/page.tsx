import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound4Data } from '@/components/page/aligement-assets/rounds/data/round-4.data';
import styles from './page.module.css';

export default function PastRound4Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound4Data} />
    </div>
  );
}
