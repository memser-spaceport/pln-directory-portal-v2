import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound5Data } from '@/components/page/aligement-assets/rounds/data/round-5.data';
import styles from './page.module.css';

export default function PastRound5Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound5Data} />
    </div>
  );
}
