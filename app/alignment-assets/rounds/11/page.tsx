import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound11Data } from '@/components/page/aligement-assets/rounds/data/round-11.data';
import styles from './page.module.css';

export default function PastRound11Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound11Data} />
    </div>
  );
}

