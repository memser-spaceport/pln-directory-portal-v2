import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound2Data } from '@/components/page/aligement-assets/rounds/data/round-2.data';
import styles from './page.module.css';

export default function PastRound2Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound2Data} />
    </div>
  );
}
