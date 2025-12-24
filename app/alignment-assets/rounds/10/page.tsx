import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound10Data } from '@/components/page/aligement-assets/rounds/data/round-10.data';
import styles from './page.module.css';

export default function PastRound10Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound10Data} />
    </div>
  );
}
